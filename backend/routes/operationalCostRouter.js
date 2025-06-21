const express = require("express");
const router = express.Router();
const { getAllOperationalCosts, getOperationalCostDetail, createOperationalCost, updateOperationalCost, deleteOperationalCost } = require("../controllers/operationalCostController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

//Operational COST Routing
// GET Find All OP COST
router.get("/", authMiddleware, permissionUser("admin"), getAllOperationalCosts);

// GET Detail OP Cost
router.get("/:id", authMiddleware, permissionUser("admin"), getOperationalCostDetail);

// POST Create OP Cost
router.post("/", authMiddleware, permissionUser("admin"), createOperationalCost);

// PUT Update OP Cost
router.put("/:id", authMiddleware, permissionUser("admin"), updateOperationalCost);

// DEL Delete OP Cost
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteOperationalCost);

module.exports = router;
