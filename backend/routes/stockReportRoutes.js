const express = require("express");
const router = express.Router();
const stockReportController = require("../controllers/stockReportController");

// Endpoint laporan stok
router.get("/", stockReportController.getStockReport);

module.exports = router;
