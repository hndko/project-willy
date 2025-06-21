const productionService = require("../services/productionService");
const asyncHandle = require("../middlewares/asyncHandle");

exports.getAllProductions = async (req, res) => {
  try {
    const data = await productionService.getAllProductions(req.query);
    res.json(data);
  } catch (error) {
    console.error("[getAllProductions] Error:", error);
    res.status(500).json({ message: error.message, error });
  }
};

exports.getProductionDetail = asyncHandle(async (req, res, next) => {
  const prod = await productionService.getProductionById(req.params.id);
  if (!prod) {
    const error = new Error("Production not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", data: prod });
});

exports.createProduction = asyncHandle(async (req, res) => {
  const prod = await productionService.createProduction(req.body);
  res.status(201).json({ status: "Success", data: prod });
});

exports.updateProduction = asyncHandle(async (req, res, next) => {
  const updated = await productionService.updateProduction(req.params.id, req.body);
  if (!updated) {
    const error = new Error("Production not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", data: updated });
});

exports.deleteProduction = asyncHandle(async (req, res, next) => {
  const deleted = await productionService.deleteProduction(req.params.id);
  if (!deleted) {
    const error = new Error("Production not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", message: `Production with id ${req.params.id} deleted` });
});

exports.processProduction = asyncHandle(async (req, res, next) => {
  try {
    const prod = await productionService.processProduction(req.params.id, req.user?.id);
    if (!prod) {
      const error = new Error("Production not found or already processed");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({ status: "Success", data: prod, message: "Production processed successfully" });
  } catch (error) {
    next(error);
  }
});

exports.getProductionHppBreakdown = asyncHandle(async (req, res) => {
  const prod = await require("../models").Production.findByPk(req.params.id);
  if (!prod) return res.status(404).json({ message: "Production not found" });

  const BoM = require("../models").BoM;
  const RawMaterial = require("../models").RawMaterial;
  const bomList = await BoM.findAll({
    where: { product_id: prod.product_id },
    include: [{ model: RawMaterial }],
  });

  const breakdown = bomList.map((bom) => {
    const qtyTotal = bom.qty * prod.qty;
    const price = bom.RawMaterial?.price || 0;
    return {
      raw_material_name: bom.RawMaterial?.name,
      qty_per_product: bom.qty,
      qty_total: qtyTotal,
      price,
      subtotal: price * qtyTotal,
      unit: bom.unit || bom.RawMaterial?.unit,
    };
  });

  const total = breakdown.reduce((sum, b) => sum + b.subtotal, 0);

  res.json({ breakdown, total });
});
