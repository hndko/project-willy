const asyncHandle = require("../middlewares/asyncHandle");
const { createActivityLog, getAllActivityLogs, getActivityLogById, updateActivityLog, deleteActivityLog } = require("../services/activityLogService");

// CREATE
exports.createLog = asyncHandle(async (req, res, next) => {
  const { userId, table, action, description } = req.body;
  const log = await createActivityLog({ userId, table, action, description });

  res.status(201).json({ status: "Success", data: log });
});

// GET ALL with search + pagination
exports.getLogs = asyncHandle(async (req, res, next) => {
  const data = await getAllActivityLogs(req.query);
  res.status(200).json({ status: "Success", data });
});

// GET by ID
exports.getLogDetail = asyncHandle(async (req, res, next) => {
  const log = await getActivityLogById(req.params.id);
  if (!log) {
    const error = new Error("Activity Log not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: log });
});

// UPDATE
exports.updateLog = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  await updateActivityLog(id, req.body);

  const updatedLog = await getActivityLogById(id);
  res.status(200).json({ status: "Success", data: updatedLog });
});

// DELETE
exports.deleteLog = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const log = await getActivityLogById(id);
  if (!log) {
    const error = new Error("Activity Log not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteActivityLog(id);
  res.status(200).json({ status: "Success", message: `Activity Log with id ${id} deleted` });
});
