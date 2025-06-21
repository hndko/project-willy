const asyncHandle = require("../middlewares/asyncHandle");
const { getAllUsages, getUsageById, createUsage, updateUsage, deleteUsage } = require("../services/usageService");
const { createActivityLog } = require("../services/activityLogService");

// GET ALL USAGES
exports.getAllUsages = asyncHandle(async (req, res, next) => {
  const data = await getAllUsages(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No usage data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET USAGE BY ID
exports.getUsageDetail = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const usage = await getUsageById(id);

  if (!usage) {
    const error = new Error("Usage not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: usage });
});

// CREATE USAGE
exports.createUsage = asyncHandle(async (req, res, next) => {
  const { rawMaterialId, userId, qty, description, date } = req.body;

  const newUsage = await createUsage({ rawMaterialId, userId, qty, description, date });

  await createActivityLog({
    userId: req.user.id,
    action: "Create Usage",
    description: `Usage created with quantity ${qty}`,
  });

  res.status(201).json({ status: "Success", data: newUsage });
});

// UPDATE USAGE
exports.updateUsage = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const usage = await getUsageById(id);

  if (!usage) {
    const error = new Error("Usage not found");
    error.statusCode = 404;
    return next(error);
  }

  const updatedUsage = await updateUsage(id, req.body);

  await createActivityLog({
    userId: req.user.id,
    action: "Update Usage",
    description: `Usage updated with quantity ${updatedUsage.qty}`,
  });

  res.status(200).json({ status: "Success", data: updatedUsage });
});

// DELETE USAGE
exports.deleteUsage = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const usage = await getUsageById(id);

  if (!usage) {
    const error = new Error("Usage not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteUsage(id);

  await createActivityLog({
    userId: req.user.id,
    action: "Delete Usage",
    description: `Usage with quantity ${usage.qty} deleted`,
  });

  res.status(200).json({ status: "Success", message: `Usage with id ${id} has been deleted` });
});
