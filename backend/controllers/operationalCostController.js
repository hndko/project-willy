const asyncHandle = require("../middlewares/asyncHandle");
const { createOperationalCost, getOperationalCostById, updateOperationalCost, deleteOperationalCost, getAllOperationalCosts } = require("../services/operationalCostService");
const { createActivityLog } = require("../services/activityLogService");

// CREATE Operational Cost
exports.createOperationalCost = asyncHandle(async (req, res, next) => {
  const cost = await createOperationalCost(req.body);

  await createActivityLog({
    userId: req.user.id,
    table: "Operational Cost",
    action: "Create Operational Cost",
    description: `Cost created for ${cost.description}`,
  });

  res.status(201).json({ status: "Success", data: cost });
});

// GET All Operational Costs With Pagination & Search
exports.getAllOperationalCosts = asyncHandle(async (req, res, next) => {
  const data = await getAllOperationalCosts(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No operational cost data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET Operational Cost by ID
exports.getOperationalCostDetail = asyncHandle(async (req, res, next) => {
  const cost = await getOperationalCostById(req.params.id);

  if (!cost) {
    const error = new Error("Operational Cost not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: cost });
});

// UPDATE Operational Cost
exports.updateOperationalCost = asyncHandle(async (req, res, next) => {
  const updated = await updateOperationalCost(req.params.id, req.body);

  if (!updated) {
    const error = new Error("Operational Cost not found or not updated");
    error.statusCode = 404;
    return next(error);
  }

  await createActivityLog({
    userId: req.user.id,
    table: "Operational Cost",
    action: "Update Operational Cost",
    description: `Updated operational cost: ${updated.description}`,
  });

  res.status(200).json({ status: "Success", data: updated });
});

// DELETE Operational Cost
exports.deleteOperationalCost = asyncHandle(async (req, res, next) => {
  const cost = await getOperationalCostById(req.params.id);

  if (!cost) {
    const error = new Error("Operational Cost not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteOperationalCost(req.params.id);

  await createActivityLog({
    userId: req.user.id,
    table: "Operational Cost",
    action: "Delete Operational Cost",
    description: `Deleted cost with id ${req.params.id}`,
  });

  res.status(200).json({
    status: "Success",
    message: `Operational Cost ${req.params.id} deleted`,
  });
});
