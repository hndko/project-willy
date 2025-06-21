const express = require("express");
const router = express.Router();
const { getAllUsages, getUsageDetail, createUsage, updateUsage, deleteUsage } = require("../controllers/usageController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// USAGE ROUTING
// GET Find ALL Usage
router.get("/", authMiddleware, permissionUser("admin"), getAllUsages);

// GET Detail Usage
router.get("/:id", authMiddleware, permissionUser("admin"), getUsageDetail);

// POST Create Usage
router.post("/", authMiddleware, permissionUser("admin"), createUsage);

// PUT Update Usage
router.put("/:id", authMiddleware, permissionUser("admin"), updateUsage);

// DEL Delete Usage
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteUsage);

module.exports = router;
