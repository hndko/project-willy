const { Invoice } = require("../models");

exports.generateInvoiceNumber = async () => {
  const latest = await Invoice.findOne({
    order: [["createdAt", "DESC"]],
  });

  let nextNumber = 1;

  if (latest && latest.invoiceNumber) {
    const lastNumber = parseInt(latest.invoiceNumber.replace("INV-", ""));
    nextNumber = lastNumber + 1;
  }

  const formatted = String(nextNumber).padStart(3, "0"); // e.g., 001
  return `INV-${formatted}`;
};
