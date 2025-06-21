const path = require("path");
const asyncHandle = require("../middlewares/asyncHandle");
const { createInvoiceFromSale, getAllInvoices, getInvoiceById, updateInvoice, deleteInvoice, updateInvoicePayment } = require("../services/invoiceService");
const { generateInvoicePDF: generatePDF } = require("../services/invoicePdfService");
const { createActivityLog } = require("../services/activityLogService");

// CREATE invoice from sale
exports.createInvoice = asyncHandle(async (req, res, next) => {
  const { saleId } = req.body;

  const invoice = await createInvoiceFromSale(saleId);

  await createActivityLog({
    userId: req.user.id,
    table: "Generate Invoice",
    action: "Create Invoice",
    description: `Created invoice ${invoice.invoiceNumber} from ${saleId}`,
  });

  res.status(201).json({ status: "Success", data: invoice });
});

// READ ALL
exports.getAllInvoices = asyncHandle(async (req, res, next) => {
  const result = await getAllInvoices(req.query);
  res.status(200).json({ status: "Success", ...result });
});

// READ DETAIL
exports.getInvoiceDetail = asyncHandle(async (req, res, next) => {
  const invoice = await getInvoiceById(req.params.id);
  if (!invoice) return next(Object.assign(new Error("Invoice not found"), { statusCode: 404 }));

  res.status(200).json({ status: "Success", data: invoice });
});

// UPDATE
exports.updateInvoice = asyncHandle(async (req, res, next) => {
  await updateInvoice(req.params.id, req.body);
  const updated = await getInvoiceById(req.params.id);

  await createActivityLog({
    userId: req.user.id,
    table: "Generate Invoice",
    action: "Update Invoice",
    description: `Updated invoice ${updated.invoiceNumber}`,
  });

  res.status(200).json({ status: "Success", data: updated });
});

// DELETE
exports.deleteInvoice = asyncHandle(async (req, res, next) => {
  const invoice = await getInvoiceById(req.params.id);
  if (!invoice) return next(Object.assign(new Error("Invoice not found"), { statusCode: 404 }));

  await deleteInvoice(req.params.id);
  await createActivityLog({
    userId: req.user.id,
    table: "Generate Invoice",
    action: "Delete Invoice",
    description: `Deleted invoice ${invoice.invoiceNumber}`,
  });

  res.status(200).json({ status: "Success", message: `Invoice ${invoice.invoiceNumber} deleted` });
});

exports.generateInvoicePDF = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const fileName = `invoice-${id}.pdf`;
  const outputPath = path.join(__dirname, "../public/invoices", fileName);

  try {
    await generatePDF(id, outputPath);
    res.status(200).json({
      status: "Success",
      message: "Invoice PDF has been generated",
      fileUrl: `/invoices/${fileName}`,
    });
  } catch (error) {
    next(error); // akan otomatis dilempar ke errorMiddleware
  }
});

// UPDATE PAYMENT
exports.updateInvoicePayment = asyncHandle(async (req, res, next) => {
  const { paymentStatus, paymentDate, paymentMethod } = req.body;

  try {
    const updated = await updateInvoicePayment(req.params.id, {
      paymentStatus,
      paymentDate,
      paymentMethod,
    });

    await createActivityLog({
      userId: req.user.id,
      table: "Generate Invoice",
      action: "Update Invoice Payment",
      description: `Updated payment for invoice ${updated.invoiceNumber} to ${paymentStatus} (and synced with associated sale)`,
    });

    res.status(200).json({ status: "Success", data: updated });
  } catch (error) {
    console.error("Error updating invoice payment:", error);
    return next(error);
  }
});
