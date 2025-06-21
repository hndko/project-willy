const express = require("express");
const router = express.Router();
const { createLog, getLogs, getLogDetail, updateLog, deleteLog } = require("../controllers/activityLogController");

// Endpoint Activity Logs
// POST Create Log
router.post("/", createLog);

// GET Find ALL Logs
router.get("/", getLogs);

// Get Detail Log
router.get("/:id", getLogDetail);

// PUT Update Logs
router.put("/:id", updateLog);

// DEL Delete Logs
router.delete("/:id", deleteLog);

module.exports = router;
