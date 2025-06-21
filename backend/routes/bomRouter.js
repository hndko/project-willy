const express = require("express");
const router = express.Router();
const bomController = require("../controllers/bomController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Validasi sederhana (bisa pakai Joi jika ingin lebih advance)
const validateBoM = (req, res, next) => {
  const { product_id, raw_material_id, qty } = req.body;
  if (!product_id || !raw_material_id || !qty) {
    return res.status(400).json({ status: "Validation Error", message: "product_id, raw_material_id, and qty are required" });
  }
  next();
};

// Grouped BoM by product
router.get("/group-by-product", authMiddleware, permissionUser("admin", "owner", "user"), bomController.getAllBoMsGroupedByProduct);
// List all BoMs
router.get("/", authMiddleware, permissionUser("admin", "owner", "user"), bomController.getAllBoMs);
// Get BoM by product
router.get("/product/:product_id", authMiddleware, permissionUser("admin", "owner", "user"), bomController.getBoMByProduct);
// Get BoM by ID
router.get("/:id", authMiddleware, permissionUser("admin", "owner", "user"), bomController.getBoMDetail);
// Create BoM
router.post("/", authMiddleware, permissionUser("admin", "owner"), validateBoM, bomController.createBoM);
// Update BoM
router.put("/:id", authMiddleware, permissionUser("admin", "owner"), validateBoM, bomController.updateBoM);

// Delete BoM
router.delete("/:id", authMiddleware, permissionUser("admin", "owner"), bomController.deleteBoM);

module.exports = router;
