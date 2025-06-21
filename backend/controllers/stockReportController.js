const stockReportService = require("../services/stockReportService");

exports.getStockReport = async (req, res) => {
  try {
    const { search = "", type = null, startDate = null, endDate = null, page = 1, limit = 10 } = req.query;

    const result = await stockReportService.getStockReport({
      search,
      type,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    console.error("Error in getStockReport:", error);
    res.status(500).json({ message: "Failed to fetch stock report", error: error.message });
  }
};
