const asyncHandle = require("../middlewares/asyncHandle");
const { Op } = require("sequelize");
const { createPurchase, getAllPurchases, getPurchaseById, updatePurchase, deletePurchase } = require("../services/purchaseService");
const { createActivityLog } = require("../services/activityLogService");
const { Purchase, RawMaterial, sequelize } = require("../models");

// CREATE Purchase
exports.createPurchase = asyncHandle(async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { rawMaterialId, supplierId, userId, qty, price, total, date, status, invoiceNumber, notes, receivedDate } = req.body;

    // Validasi rawMaterial
    const material = await RawMaterial.findByPk(rawMaterialId, { transaction: t });
    if (!material) throw new Error("Raw material not found");

    // Pastikan price tidak null/undefined
    const safePrice = typeof price === "number" && !isNaN(price) ? price : material.price;

    // Update stock & price raw material
    material.stock += parseInt(qty);
    material.price = safePrice;
    await material.save({ transaction: t });

    // Siapkan payload purchase, hapus invoiceNumber jika kosong
    const purchasePayload = { rawMaterialId, supplierId, userId, qty, price: safePrice, total, date, status, notes, receivedDate };
    if (invoiceNumber && invoiceNumber.trim() !== "") {
      purchasePayload.invoiceNumber = invoiceNumber;
    }

    // Simpan data purchase
    const purchase = await Purchase.create(purchasePayload, { transaction: t });

    // Activity Log
    await createActivityLog(
      {
        userId: req.user.id,
        action: "Create Purchase",
        description: `Created purchase of ${qty} units for material ${material.name}`,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ status: "Success", data: purchase });
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// GET All Purchases With Pagination & Search
exports.getAllPurchases = asyncHandle(async (req, res, next) => {
  const data = await getAllPurchases(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No purchases data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET Purchase by ID
exports.getPurchaseDetail = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const purchase = await getPurchaseById(id);

  if (!purchase) {
    const error = new Error("Purchase not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: purchase });
});

// UPDATE Purchase
exports.updatePurchase = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const { qty, price, total, date, status, invoiceNumber, notes, receivedDate } = req.body;

  const purchase = await getPurchaseById(id);
  if (!purchase) {
    const error = new Error("Purchase not found");
    error.statusCode = 404;
    return next(error);
  }

  // Update stock & price raw material jika qty berubah
  const material = await RawMaterial.findByPk(purchase.rawMaterialId);
  if (material) {
    // Hitung selisih qty
    const qtyDiff = parseInt(qty) - purchase.qty;
    // Pastikan price tidak null/undefined
    const safePrice = typeof price === "number" && !isNaN(price) ? price : material.price;
    material.stock += qtyDiff;
    material.price = safePrice;
    await material.save();
  }

  await updatePurchase(id, { qty, price, total, date, status, invoiceNumber, notes, receivedDate });

  // Log activity
  await createActivityLog({
    userId: req.user.id,
    action: "Update Purchase",
    description: `Updated purchase with id ${id}`,
  });

  const updatedPurchase = await getPurchaseById(id);

  res.status(200).json({ status: "Success", data: updatedPurchase });
});

// DELETE Purchase
exports.deletePurchase = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const purchase = await getPurchaseById(id);
  if (!purchase) {
    const error = new Error("Purchase not found");
    error.statusCode = 404;
    return next(error);
  }

  await deletePurchase(id);

  // Add activity log for delete operation
  await createActivityLog({
    userId: req.user.id,
    action: "Delete Purchase",
    description: `Deleted purchase with id ${id}`,
    table: "Purchase",
  });

  res.status(200).json({ status: "Success", message: `Purchase with id ${id} deleted` });
});
