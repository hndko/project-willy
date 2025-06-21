const express = require("express");
const router = express.Router();
const { createInvoice, getAllInvoices, getInvoiceDetail, updateInvoice, deleteInvoice, generateInvoicePDF, updateInvoicePayment } = require("../controllers/invoiceController");
const validateRequest = require("../middlewares/validationBodyMiddleware");
const { updatePaymentSchema } = require("../middlewares/invoiceValidation");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// ROUTING
// GET All Invoices
router.get("/", authMiddleware, permissionUser("admin"), getAllInvoices);

// GET Invoice Detail
router.get("/:id", authMiddleware, permissionUser("admin"), getInvoiceDetail);

// POST Create Invoice
router.post("/", authMiddleware, permissionUser("admin"), createInvoice);

// PUT Update Invoice
router.put("/:id", authMiddleware, permissionUser("admin"), updateInvoice);

// PATCH Update Invoice Payment
router.patch("/:id/payment", authMiddleware, permissionUser("admin"), validateRequest(updatePaymentSchema), updateInvoicePayment);

// DELETE Invoice
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteInvoice);

// GENERATE PDF
router.get("/pdf/:id", authMiddleware, permissionUser("admin"), generateInvoicePDF);

module.exports = router;
