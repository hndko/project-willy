const express = require("express");
const router = express.Router();
const { getCustomers, getCustomerDetail, createCustomer, updateCustomer, deleteCustomer } = require("../controllers/customerController");

const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Customer Routing

//Get All Customer
router.get("/", authMiddleware, permissionUser("admin", "sales"), getCustomers);

// Detail Customer
router.get("/:id", authMiddleware, permissionUser("admin", "sales"), getCustomerDetail);

// Create Customer
router.post("/", authMiddleware, permissionUser("admin", "sales"), createCustomer);

// Update Customer
router.put("/:id", authMiddleware, permissionUser("admin", "sales"), updateCustomer);

// Delete Customer
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteCustomer);

module.exports = router;
