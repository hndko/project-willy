const express = require("express");
const router = express.Router();
const { getAllRawMaterials, getRawMaterialDetail, createRawMaterial, updateRawMaterial, deleteRawMaterial } = require("../controllers/rawMaterialController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Routing
// GET Find ALL Material
router.get("/", authMiddleware, permissionUser("admin", "purchaser"), getAllRawMaterials);

// GET Detail Material
router.get("/:id", authMiddleware, permissionUser("admin", "purchaser"), getRawMaterialDetail);

// POST Create Material
router.post("/", authMiddleware, permissionUser("admin", "purchaser"), createRawMaterial);

// PUT Update Material
router.put("/:id", authMiddleware, permissionUser("admin", "purchaser"), updateRawMaterial);

// DEL Delete Material
router.delete("/:id", authMiddleware, permissionUser("admin", "purchaser"), deleteRawMaterial);

module.exports = router;
