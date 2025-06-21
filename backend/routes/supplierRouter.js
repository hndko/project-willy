const express = require("express");
const router = express.Router();
const { getAllSuppliers, getSupplierDetail, createSupplier, updateSupplier, deleteSupplier } = require("../controllers/supplierController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Routing
// GET Find ALL Supplier
router.get("/", getAllSuppliers);

// GET Detail Supplier
router.get("/:id", authMiddleware, permissionUser("admin", "user"), getSupplierDetail);

// POST Create Supplier
router.post("/", authMiddleware, permissionUser("admin"), createSupplier);

// PUT Update Supplier
router.put("/:id", authMiddleware, permissionUser("admin"), updateSupplier);

// DEL Delete Supplier
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteSupplier);

module.exports = router;
