const express = require("express");
const router = express.Router();
const { getAllSales, getSaleDetail, createSale, updateSale, deleteSale } = require("../controllers/saleController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Sale Routing
// GET Find ALL Sales
router.get("/", authMiddleware, permissionUser("admin", "sales"), getAllSales);

// GET Sale By ID
router.get("/:id", authMiddleware, permissionUser("admin", "sales"), getSaleDetail);

// POST Create Sale
router.post("/", authMiddleware, permissionUser("admin", "sales"), createSale);

// PUT Update Sale
router.put("/:id", authMiddleware, permissionUser("admin", "sales"), updateSale);

// DEL Delete Sale
router.delete("/:id", authMiddleware, permissionUser("admin", "sales"), deleteSale);

module.exports = router;
