const asyncHandle = require("../middlewares/asyncHandle");
const { createSale, getAllSales, getSaleById, updateSale, deleteSale } = require("../services/saleService");
const { createActivityLog } = require("../services/activityLogService");
const { createInvoiceFromSale } = require("../services/invoiceService");
const { Product } = require("../models");
const { createDelivery } = require("../services/deliveryService");

// CREATE SALE
exports.createSale = asyncHandle(async (req, res, next) => {
  const { productId, customerId, qty, price, discount = 0, shippingCost = 0, adminFee = 0, tax = 0, total, paymentStatus = "unpaid", paymentDate = null, paymentMethod = null, date } = req.body;
  const userId = req.user.id;

  const product = await Product.findByPk(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    return next(error);
  }

  if (product.stock < qty) {
    const error = new Error("Stock not enough for this sale");
    error.statusCode = 400;
    return next(error);
  }

  // Kurangi stock produk
  product.stock -= parseInt(qty);
  await product.save({ reason: "sale" });

  const sale = await createSale({
    productId,
    customerId,
    userId,
    qty,
    price,
    discount,
    shippingCost,
    adminFee,
    tax,
    total,
    paymentStatus,
    paymentDate,
    paymentMethod,
    date,
  });

  await createActivityLog({
    userId: req.user.id,
    table: "Sale",
    action: "Create Sale",
    description: `Sale created: ${qty} pcs of ${product.name}`,
  });

  // AUTO-CREATE DELIVERY (langsung, status pending, tanpa validasi tambahan)
  try {
    await createDelivery({
      saleId: sale.id,
      userId: req.user.id,
      status: "pending",
      shippingAddress: req.body.shippingAddress || "-",
      shippingMethod: req.body.shippingMethod || "",
      courier: "",
      trackingNumber: "",
      scheduledDate: null,
      deliveryDate: null,
      notes: "",
    });
  } catch (err) {
    console.error("Error auto-creating delivery after sale:", err);
    // Tidak menggagalkan create sale
  }

  // Automatically generate invoice from the created sale
  try {
    const invoice = await createInvoiceFromSale(sale.id, req.user.id);

    await createActivityLog({
      userId: req.user.id,
      table: "Generate Invoice",
      action: "Auto Create Invoice",
      description: `Auto-created invoice ${invoice.invoiceNumber} from sale ${sale.id}`,
    });

    // Add invoice info to the response
    res.status(201).json({
      status: "Success",
      data: sale,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
  } catch (error) {
    // Even if invoice creation fails, the sale was successful
    console.error("Error auto-generating invoice:", error);
    res.status(201).json({
      status: "Success",
      data: sale,
      invoiceError: "Failed to automatically generate invoice. Please create manually.",
    });
  }
});

// GET ALL SALES With Pagination & Search
exports.getAllSales = asyncHandle(async (req, res, next) => {
  const data = await getAllSales(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No sales data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET SALE BY ID
exports.getSaleDetail = asyncHandle(async (req, res, next) => {
  const sale = await getSaleById(req.params.id);

  if (!sale) {
    const error = new Error("Sale not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: sale });
});

// UPDATE SALE
exports.updateSale = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const { productId, customerId, qty, price, discount, shippingCost, adminFee, tax, total, paymentStatus, paymentDate, paymentMethod, date } = req.body;

  // Get existing sale to check product stock changes
  const existingSale = await getSaleById(id);
  if (!existingSale) {
    const error = new Error("Sale not found");
    error.statusCode = 404;
    return next(error);
  }

  // If productId and qty have changed, update product stock
  if (productId && productId !== existingSale.productId && qty) {
    // Return stock to original product
    const originalProduct = await Product.findByPk(existingSale.productId);
    if (originalProduct) {
      originalProduct.stock += parseInt(existingSale.qty);
      await originalProduct.save();
    }

    // Deduct stock from new product
    const newProduct = await Product.findByPk(productId);
    if (!newProduct) {
      const error = new Error("New product not found");
      error.statusCode = 404;
      return next(error);
    }

    if (newProduct.stock < qty) {
      const error = new Error("New product stock not enough for this sale");
      error.statusCode = 400;
      return next(error);
    }

    newProduct.stock -= parseInt(qty);
    await newProduct.save({ reason: "sale" });
  } else if (qty && qty !== existingSale.qty) {
    // Only qty has changed, update the same product's stock
    const product = await Product.findByPk(existingSale.productId);
    if (product) {
      // Calculate stock difference
      const stockDiff = existingSale.qty - qty;
      product.stock += stockDiff;
      await product.save({ reason: "sale" });
    }
  }

  // Update sale with all fields
  const updatedSale = await updateSale(id, {
    productId,
    customerId,
    qty,
    price,
    discount,
    shippingCost,
    adminFee,
    tax,
    total,
    paymentStatus,
    paymentDate,
    paymentMethod,
    date,
  });

  await createActivityLog({
    userId: req.user.id,
    table: "Sale",
    action: "Update Sale",
    description: `Sale updated: ${updatedSale.id}`,
  });

  res.status(200).json({ status: "Success", data: updatedSale });
});

// DELETE SALE
exports.deleteSale = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const sale = await getSaleById(id);
  if (!sale) {
    const error = new Error("Sale not found");
    error.statusCode = 404;
    return next(error);
  }

  // Return stock to product
  const product = await Product.findByPk(sale.productId);
  if (product) {
    product.stock += parseInt(sale.qty);
    await product.save();
  }

  await deleteSale(id);

  await createActivityLog({
    userId: req.user.id,
    table: "Sale",
    action: "Delete Sale",
    description: `Sale deleted: ${sale.id}`,
  });

  res.status(200).json({ status: "Success", message: `Sale with id ${id} has been deleted` });
});
