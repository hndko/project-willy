const bomService = require("../services/bomService");
const asyncHandle = require("../middlewares/asyncHandle");
const { createActivityLog } = require("../services/activityLogService");

exports.getAllBoMs = asyncHandle(async (req, res) => {
  const data = await bomService.getAllBoMs(req.query);
  res.status(200).json({ status: "Success", data });
});

exports.getBoMDetail = asyncHandle(async (req, res, next) => {
  const bom = await bomService.getBoMById(req.params.id);
  if (!bom) {
    const error = new Error("BoM not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", data: bom });
});

exports.createBoM = asyncHandle(async (req, res) => {
  const bom = await bomService.createBoM(req.body);
  await createActivityLog({
    userId: req.user?.id,
    table: "BoM",
    action: "Create BoM",
    description: `Created BoM for product ${bom.product_id} with raw material ${bom.raw_material_id} (qty: ${bom.qty})`,
  });
  res.status(201).json({ status: "Success", data: bom });
});

exports.updateBoM = asyncHandle(async (req, res, next) => {
  const updated = await bomService.updateBoM(req.params.id, req.body);
  if (!updated) {
    const error = new Error("BoM not found");
    error.statusCode = 404;
    return next(error);
  }
  await createActivityLog({
    userId: req.user?.id,
    table: "BoM",
    action: "Update BoM",
    description: `Updated BoM for product ${updated.product_id} with raw material ${updated.raw_material_id} (qty: ${updated.qty})`,
  });
  res.status(200).json({ status: "Success", data: updated });
});

exports.deleteBoM = asyncHandle(async (req, res, next) => {
  const deleted = await bomService.deleteBoM(req.params.id);
  if (!deleted) {
    const error = new Error("BoM not found");
    error.statusCode = 404;
    return next(error);
  }
  await createActivityLog({
    userId: req.user?.id,
    table: "BoM",
    action: "Delete BoM",
    description: `Deleted BoM with id ${req.params.id}`,
  });
  res.status(200).json({ status: "Success", message: `BoM with id ${req.params.id} deleted` });
});

exports.getBoMByProduct = asyncHandle(async (req, res) => {
  const data = await bomService.getBoMByProduct(req.params.product_id);
  // Debug log: tampilkan hasil query ke terminal
  console.log("[DEBUG] BoM API result:", JSON.stringify(data, null, 2));
  res.status(200).json({ status: "Success", data });
});

exports.getAllBoMsGroupedByProduct = asyncHandle(async (req, res) => {
  const { Product, BoM, RawMaterial } = require("../models");
  const products = await Product.findAll({
    include: [
      {
        model: BoM,
        include: [
          {
            model: RawMaterial,
            attributes: ["id", "name", "unit"],
          },
        ],
      },
    ],
    order: [["name", "ASC"]],
  });
  res.status(200).json({ status: "Success", data: products });
});
