const express = require("express");
const router = express.Router();
const { getAllDeliveries, getDeliveryDetail, getDeliveryBySale, createDelivery, updateDelivery, deleteDelivery } = require("../controllers/deliveryController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Delivery Routing
// GET Find Delivery By Sale ID - This more specific route must come before the generic ID route
router.get("/sale/:saleId", authMiddleware, permissionUser("admin", "sales"), getDeliveryBySale);

// GET Find Delivery By ID
router.get("/:id", authMiddleware, permissionUser("admin", "sales"), getDeliveryDetail);

// GET Find ALL Deliveries
router.get("/", authMiddleware, permissionUser("admin", "sales"), getAllDeliveries);

// POST Create Delivery
router.post("/", authMiddleware, permissionUser("admin", "sales"), createDelivery);

// PUT Update Delivery
router.put("/:id", authMiddleware, permissionUser("admin", "sales"), updateDelivery);

// DELETE Delivery
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteDelivery);

module.exports = router;
