const express = require("express");
const router = express.Router();
const { getAllPurchases, getPurchaseDetail, createPurchase, updatePurchase, deletePurchase } = require("../controllers/purchaseController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Purchase Routing
// GET Find ALL Purchase
router.get("/", authMiddleware, permissionUser("admin", "purchaser"), getAllPurchases);

// GET Detail Purchase
router.get("/:id", authMiddleware, permissionUser("admin", "purchaser"), getPurchaseDetail);

// POST Create Purchase
router.post("/", authMiddleware, permissionUser("admin", "purchaser"), createPurchase);

// PUT Update Purchase
router.put("/:id", authMiddleware, permissionUser("admin", "purchaser"), updatePurchase);

// DEL Delete Purchase
router.delete("/:id", authMiddleware, permissionUser("admin", "purchaser"), deletePurchase);

module.exports = router;
