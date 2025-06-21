const express = require("express");
const router = express.Router();
const { getStocks, getStockDetail, createStock, updateStock, deleteStock, searchStockReport } = require("../controllers/stockController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Stock Routes
//Get Find All Stock
router.get("/", authMiddleware, permissionUser("admin", "stock"), getStocks);

// Get Detail Stock
router.get("/:id", authMiddleware, permissionUser("admin", "stock"), getStockDetail);

// POST Create Stock
router.post("/", authMiddleware, permissionUser("admin", "stock"), createStock);

// Get Report Stock
router.get("/report", authMiddleware, permissionUser("admin", "stock"), searchStockReport);

// PUT Update Stock
router.put("/:id", authMiddleware, permissionUser("admin", "stock"), updateStock);

// DEL Delete Stock
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteStock);

module.exports = router;
