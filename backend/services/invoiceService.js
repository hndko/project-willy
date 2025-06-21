const { Invoice, InvoiceItem, User, Customer, Product, Sale, sequelize } = require("../models");
const { generateInvoiceNumber } = require("../utils/generateInvoiceNumber");
const { Op } = require("sequelize");

// Create invoice & invoice_item from sale
exports.createInvoiceFromSale = async (saleId) => {
  const sale = await Sale.findByPk(saleId, {
    include: [Product, Customer, User],
  });

  if (!sale) {
    const error = new Error("Sale not found");
    error.statusCode = 404;
    throw error;
  }

  const invoiceNumber = await generateInvoiceNumber();

  // Copy all relevant data from the sale to the invoice
  const invoice = await Invoice.create({
    saleId: sale.id,
    userId: sale.userId,
    customerId: sale.customerId,
    date: sale.date,
    total: sale.total,
    // Sync financial details from sale
    shippingCost: sale.shippingCost || 0,
    adminFee: sale.adminFee || 0,
    tax: sale.tax || 0,
    discount: sale.discount || 0,
    // Sync payment details from sale
    paymentStatus: sale.paymentStatus || "unpaid",
    paymentDate: sale.paymentDate || null,
    paymentMethod: sale.paymentMethod || null,
    invoiceNumber,
  });

  await InvoiceItem.create({
    invoiceId: invoice.id,
    productId: sale.productId,
    nameSnapshot: sale.Product.name,
    priceSnapshot: sale.price,
    qty: sale.qty,
    subtotal: sale.price * sale.qty,
    shippingCost: sale.shippingCost,
    adminFee: sale.adminFee,
    tax: sale.tax,
    discount: sale.discount,
  });

  return invoice;
};

exports.getAllInvoices = async (query) => {
  console.log("getAllInvoices called with query:", query);
  const { page = 1, limit = 10, search = "", month = "", paymentStatus = "" } = query;
  const offset = (page - 1) * limit;

  let whereCondition = {};

  // Search functionality
  if (search) {
    whereCondition = {
      [Op.or]: [{ invoiceNumber: { [Op.like]: `%${search}%` } }, { "$Customer.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }],
    };
  }

  // Add month filter if present
  if (month) {
    const [year, monthNum] = month.split("-").map((num) => parseInt(num, 10));

    // Create date range for the selected month
    const startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed in JavaScript
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    whereCondition.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  // Add payment status filter
  if (paymentStatus) {
    whereCondition.payment_status = paymentStatus;
  }

  const invoices = await Invoice.findAndCountAll({
    where: whereCondition,
    include: [{ model: User, attributes: ["id", "name"] }, { model: Customer, attributes: ["id", "name"] }, { model: Sale }, { model: InvoiceItem, include: [Product] }],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true, // Important for correct count with eager loading
  });

  console.log(`Found ${invoices.count} invoices with filters:`, {
    search,
    month,
    paymentStatus,
    page,
    limit,
  });

  if (invoices.count > 0) {
    console.log("Sample invoice data:", JSON.stringify(invoices.rows[0], null, 2).substring(0, 200) + "...");
  }

  const result = {
    totalData: invoices.count,
    totalPages: Math.ceil(invoices.count / limit),
    currentPage: parseInt(page),
    data: invoices.rows,
  };

  console.log("Returning response with structure:", {
    totalData: result.totalData,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    dataLength: result.data.length,
  });

  return result;
};

exports.getInvoiceById = async (id) => {
  return await Invoice.findByPk(id, {
    include: [{ model: User, attributes: ["id", "name"] }, { model: Customer, attributes: ["id", "name"] }, { model: Sale }, { model: InvoiceItem, include: [Product] }],
  });
};

exports.updateInvoice = async (id, data) => {
  const { saleId, userId, customerId, date, total, tax, discount, items, paymentStatus, paymentDate, paymentMethod } = data;
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw new Error("Invoice not found");

  await invoice.update({
    saleId,
    userId,
    customerId,
    date,
    total,
    tax,
    discount,
    shippingCost,
    adminFee,
    paymentStatus,
    paymentDate,
    paymentMethod,
  });

  if (items && Array.isArray(items)) {
    await InvoiceItem.destroy({ where: { invoice_id: id } });

    const newItems = items.map((item) => ({
      invoice_id: id,
      product_id: item.productId,
      name_snapshot: item.nameSnapshot,
      price_snapshot: item.priceSnapshot,
      qty: item.qty,
      subtotal: item.subtotal,
      shipping_cost: item.shippingCost,
      admin_fee: item.adminFee,
      tax: item.tax,
      discount: item.discount,
    }));

    await InvoiceItem.bulkCreate(newItems);
  }

  return await Invoice.findByPk(id, { include: ["InvoiceItems"] });
};

exports.deleteInvoice = async (id) => {
  await InvoiceItem.destroy({ where: { invoiceId: id } });
  return await Invoice.destroy({ where: { id } });
};

// Update invoice payment
exports.updateInvoicePayment = async (id, paymentData) => {
  const { paymentStatus, paymentDate, paymentMethod } = paymentData;
  const invoice = await Invoice.findByPk(id, {
    include: [{ model: Sale }],
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  // Start transaction to ensure both invoice and sale are updated together
  const t = await sequelize.transaction();

  try {
    // Update invoice payment details
    await invoice.update(
      {
        paymentStatus,
        paymentDate,
        paymentMethod,
      },
      { transaction: t }
    );

    // If this invoice has an associated sale, update its payment details too
    if (invoice.Sale && invoice.Sale.id) {
      await Sale.update(
        {
          paymentStatus,
          paymentDate,
          paymentMethod,
        },
        {
          where: { id: invoice.Sale.id },
          transaction: t,
        }
      );
    }

    // Commit transaction
    await t.commit();

    // Return updated invoice with related data
    return await Invoice.findByPk(id, {
      include: [{ model: User, attributes: ["id", "name"] }, { model: Customer, attributes: ["id", "name"] }, { model: Sale }, { model: InvoiceItem, include: [Product] }],
    });
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    throw error;
  }
};
