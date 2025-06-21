const express = require("express");
const router = express.Router();
const productionController = require("../controllers/productionController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Validasi sederhana (bisa pakai Joi jika ingin lebih advance)
const validateProduction = (req, res, next) => {
  const { product_id, user_id, qty, production_date } = req.body;
  if (!product_id || !user_id || !qty || !production_date) {
    return res.status(400).json({ status: "Validation Error", message: "product_id, user_id, qty, and production_date are required" });
  }
  next();
};

// List all productions
router.get("/", authMiddleware, permissionUser("admin", "owner", "user"), productionController.getAllProductions);
// Get production by ID
router.get("/:id", authMiddleware, permissionUser("admin", "owner", "user"), productionController.getProductionDetail);
// Create production (planned)
router.post("/", authMiddleware, permissionUser("admin", "owner"), validateProduction, productionController.createProduction);
// Update production
router.put("/:id", authMiddleware, permissionUser("admin", "owner"), validateProduction, productionController.updateProduction);
// Delete production
router.delete("/:id", authMiddleware, permissionUser("admin", "owner"), productionController.deleteProduction);
// Process production (mark as done, update stock, calculate HPP)
router.post("/:id/process", authMiddleware, permissionUser("admin", "owner"), productionController.processProduction);
// Get production HPP breakdown
router.get("/:id/hpp-breakdown", authMiddleware, permissionUser("admin", "owner", "user"), productionController.getProductionHppBreakdown);

module.exports = router;
