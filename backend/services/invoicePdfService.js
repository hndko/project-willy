const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { Invoice, InvoiceItem, Customer, Product, User, Profile, Sale } = require("../models");

exports.generateInvoicePDF = async (invoiceId, outputPath) => {
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [
      {
        model: Customer,
      },
      {
        model: User,
        include: [
          {
            model: Profile,
            as: "profile",
          },
        ],
      },
      {
        model: InvoiceItem,
        include: [Product],
      },
      {
        model: Sale,
      },
    ],
  });

  if (!invoice) throw new Error("Invoice not found");

  // Create PDF document with margin
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    info: {
      Title: `Invoice-${invoice.invoiceNumber}`,
      Author: "Project KP System",
    },
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Define colors - Updated with more subtle, elegant colors
  const colors = {
    primary: "#2563eb", // Deeper blue
    secondary: "#64748b", // Slate gray
    success: "#059669", // Deep green
    warning: "#d97706", // Deep amber
    danger: "#dc2626", // Deep red
    light: "#f8fafc", // Very light blue gray
    dark: "#0f172a", // Very dark blue gray
    white: "#ffffff", // White
    black: "#0f172a", // Very dark blue gray
    accent: "#f3f4f6", // Light gray for subtle accents
    lightBorder: "#e2e8f0", // Light border color
  };

  // Define payment status colors and text
  const paymentStatusConfig = {
    paid: { color: colors.success, text: "PAID" },
    partial: { color: colors.warning, text: "PARTIAL PAYMENT" },
    unpaid: { color: colors.danger, text: "UNPAID" },
  };

  // Helper for drawing rectangles with rounded corners
  const drawRoundedRect = (x, y, width, height, radius, fillColor) => {
    doc.roundedRect(x, y, width, height, radius).fill(fillColor);
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    // Ensure amount is a number
    const numAmount = typeof amount === "string" ? parseFloat(amount) : Number(amount);

    // Handle invalid numbers
    if (isNaN(numAmount)) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(numAmount)
      .replace(/\s+/g, " ");
  };

  // Helper to format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status color and text
  const statusConfig = paymentStatusConfig[invoice.paymentStatus || "unpaid"];

  // Company info (could be fetched from a settings table in a real app)
  const companyInfo = {
    name: "PT Excellent Inventory Pro",
    address: "Jl. Soekarno Hatta No. 123",
    city: "Bandung, West Java, 40123",
    phone: "+62 812-3456-7890",
    email: "info@excellentpro.id",
  };

  // Bank info (for unpaid invoices)
  const bankInfo = {
    accountName: "Mohammad Ikhsan Budiasto",
    bank: "BANK BCA",
    accountNumber: "XXXXXXXXXXX",
  };

  // Salesperson info
  const salespersonName = invoice.User?.profile?.full_name || invoice.User?.name || "Admin";

  // ==================== START DRAWING THE INVOICE ====================

  // Header section with logo and title
  // Modern logo placeholder with rounded corner
  doc.roundedRect(50, 50, 80, 40, 5).fillAndStroke(colors.light, colors.lightBorder);
  doc.fontSize(16).fillColor(colors.dark).text("LOGO", 66, 62);

  // Invoice title
  doc.fontSize(28).fillColor(colors.primary).text("INVOICE", 50, 50, { align: "right" });

  // Invoice number directly below title
  doc.fontSize(11).fillColor(colors.secondary).text(`#${invoice.invoiceNumber}`, 50, 85, { align: "right" });

  // Subtle divider line
  doc.moveTo(50, 110).lineTo(550, 110).strokeColor(colors.lightBorder).stroke();

  // === Company and Invoice Info Section ===
  // Company information (FROM)
  doc.fontSize(10).fillColor(colors.secondary).text("FROM", 50, 125);
  doc.fontSize(12).fillColor(colors.dark).text(companyInfo.name, 50, 140);
  doc.fontSize(9).fillColor(colors.secondary).text(companyInfo.address, 50, 155).text(companyInfo.city, 50, 170).text(`Phone: ${companyInfo.phone}`, 50, 185).text(`Email: ${companyInfo.email}`, 50, 200);

  // Invoice information - right side
  doc.fontSize(10).fillColor(colors.secondary).text("DATE", 400, 125);
  doc.fontSize(11).fillColor(colors.dark).text(formatDate(invoice.date), 400, 140);

  doc.fontSize(10).fillColor(colors.secondary).text("PRINT ON", 400, 165);
  doc.fontSize(11).fillColor(colors.dark).text(formatDate(new Date()), 400, 180);

  if (invoice.saleId) {
    doc.fontSize(10).fillColor(colors.secondary).text("SALE REF", 400, 205);
    doc
      .fontSize(11)
      .fillColor(colors.dark)
      .text(invoice.saleId ? invoice.saleId.substring(0, 8) + "..." : "N/A", 400, 220);
  }

  // === Customer and Payment Section ===
  const customerSectionY = 240;

  // Customer information (BILL TO)
  doc.fontSize(10).fillColor(colors.secondary).text("BILL TO", 50, customerSectionY);
  doc
    .fontSize(12)
    .fillColor(colors.dark)
    .text(invoice.Customer?.name || "Customer", 50, customerSectionY + 15);

  // Add customer details if available
  if (invoice.Customer) {
    let detailY = customerSectionY + 30;
    if (invoice.Customer.address) {
      doc.fontSize(9).fillColor(colors.secondary).text(invoice.Customer.address, 50, detailY);
      detailY += 15;
    }
    if (invoice.Customer.email) {
      doc.fontSize(9).fillColor(colors.secondary).text(`Email: ${invoice.Customer.email}`, 50, detailY);
      detailY += 15;
    }
    if (invoice.Customer.phone) {
      doc.fontSize(9).fillColor(colors.secondary).text(`Phone: ${invoice.Customer.phone}`, 50, detailY);
    }
  } else {
    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text("No customer information available", 50, customerSectionY + 30);
  }

  // Payment Status - modern tag style
  doc.fontSize(10).fillColor(colors.secondary).text("PAYMENT STATUS", 350, customerSectionY);

  // Draw status box with more rounded corners
  drawRoundedRect(350, customerSectionY + 15, 180, 30, 8, statusConfig.color);
  doc
    .fontSize(14)
    .fillColor(colors.white)
    .text(statusConfig.text, 350, customerSectionY + 22, { width: 180, align: "center" });

  // Payment details with cleaner layout
  if (invoice.paymentMethod || invoice.paymentDate) {
    const paymentDetailsY = customerSectionY + 60;

    if (invoice.paymentMethod) {
      doc.fontSize(10).fillColor(colors.secondary).text("Payment Method:", 350, paymentDetailsY);
      doc
        .fontSize(11)
        .fillColor(colors.dark)
        .text(invoice.paymentMethod || "-", 450, paymentDetailsY);
    }

    if (invoice.paymentDate) {
      doc
        .fontSize(10)
        .fillColor(colors.secondary)
        .text("Payment Date:", 350, paymentDetailsY + 20);
      doc
        .fontSize(11)
        .fillColor(colors.dark)
        .text(formatDate(invoice.paymentDate) || "-", 450, paymentDetailsY + 20);
    }
  }

  // === Items Table ===
  const tableTop = 340;
  const itemTableHeaders = ["ITEM", "QTY", "UNIT PRICE", "AMOUNT"];
  const itemColumnWidths = [280, 70, 90, 80];

  // Draw table header - more subtle background
  doc
    .fillColor(colors.light)
    .roundedRect(50, tableTop - 10, 500, 30, 4)
    .fill();
  doc
    .fillColor(colors.primary)
    .rect(50, tableTop - 10, 4, 30)
    .fill(); // Left accent border

  // Header text
  doc.fontSize(10).fillColor(colors.dark);
  let xPos = 50;
  itemTableHeaders.forEach((header, i) => {
    const textWidth = itemColumnWidths[i];
    const textX = header === "ITEM" ? xPos + 15 : xPos + 10; // Extra padding for first column
    doc.text(header, textX, tableTop, { width: textWidth });
    xPos += textWidth;
  });

  // Draw items
  let yPos = tableTop + 30;
  let altRow = false;

  invoice.InvoiceItems.forEach((item, idx) => {
    // Alternating row background for better readability
    if (altRow) {
      doc
        .fillColor(colors.light)
        .rect(50, yPos - 10, 500, 30)
        .fill();
    }
    altRow = !altRow;

    // Item name and details
    doc.fontSize(10).fillColor(colors.dark).text(item.nameSnapshot, 70, yPos, { width: 240 });

    // Quantity
    doc.text(item.qty.toString(), 340, yPos, { width: 70, align: "center" });

    // Unit price - ensure it's a number
    const unitPrice = typeof item.priceSnapshot === "string" ? parseFloat(item.priceSnapshot) : item.priceSnapshot;
    doc.text(formatCurrency(unitPrice), 400, yPos, { width: 90, align: "right" });

    // Amount - recalculate to ensure accuracy
    const lineAmount = item.qty * unitPrice;
    doc.text(formatCurrency(lineAmount), 490, yPos, { width: 70, align: "right" });

    yPos += 30;
  });

  // Subtle line below items
  doc
    .moveTo(50, yPos - 10)
    .lineTo(550, yPos - 10)
    .strokeColor(colors.lightBorder)
    .stroke();

  // === Totals Section ===

  // Calculate the correct subtotal from invoice items
  let calculatedSubtotal = 0;
  if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
    calculatedSubtotal = invoice.InvoiceItems.reduce((sum, item) => {
      const price = typeof item.priceSnapshot === "string" ? parseFloat(item.priceSnapshot) : item.priceSnapshot;
      return sum + item.qty * price;
    }, 0);
  }

  // Use calculated subtotal or fall back to invoice.total
  const subtotal = calculatedSubtotal || invoice.total || 0;
  const shippingCost = invoice.shippingCost || (invoice.Sale ? invoice.Sale.shippingCost || 0 : 0);
  const adminFee = invoice.adminFee || (invoice.Sale ? invoice.Sale.adminFee || 0 : 0);
  const discount = invoice.discount || 0;
  const tax = invoice.tax || 0;

  // Recalculate the correct total based on sale details
  const total = subtotal + (tax || 0) - (discount || 0) + (shippingCost || 0) + (adminFee || 0);

  // Draw totals section
  const totalsBoxX = 350;
  const totalsBoxY = yPos;
  const totalsBoxWidth = 200;

  // Subtotal
  doc.fontSize(10).fillColor(colors.secondary).text("Subtotal:", totalsBoxX, totalsBoxY);
  doc
    .fontSize(10)
    .fillColor(colors.dark)
    .text(formatCurrency(subtotal), totalsBoxX + 100, totalsBoxY, { align: "right" });

  // Shipping - selalu tampilkan meskipun 0
  doc
    .fontSize(10)
    .fillColor(colors.secondary)
    .text("Shipping:", totalsBoxX, totalsBoxY + 20);
  doc
    .fontSize(10)
    .fillColor(colors.dark)
    .text(formatCurrency(shippingCost), totalsBoxX + 100, totalsBoxY + 20, { align: "right" });

  // Admin Fee - selalu tampilkan meskipun 0
  doc
    .fontSize(10)
    .fillColor(colors.secondary)
    .text("Admin Fee:", totalsBoxX, totalsBoxY + 40);
  doc
    .fontSize(10)
    .fillColor(colors.dark)
    .text(formatCurrency(adminFee), totalsBoxX + 100, totalsBoxY + 40, { align: "right" });

  // Discount
  let currentY = totalsBoxY + 60;
  if (discount) {
    doc.fontSize(10).fillColor(colors.secondary).text("Discount:", totalsBoxX, currentY);
    doc
      .fontSize(10)
      .fillColor(colors.success)
      .text("-" + formatCurrency(discount), totalsBoxX + 100, currentY, { align: "right" });
    currentY += 20;
  } else {
    // Skip the space for discount if there's none
    currentY = totalsBoxY + 60;
  }

  // Tax - selalu tampilkan meskipun 0
  doc.fontSize(10).fillColor(colors.secondary).text("Tax:", totalsBoxX, currentY);
  doc
    .fontSize(10)
    .fillColor(colors.dark)
    .text(formatCurrency(tax), totalsBoxX + 100, currentY, { align: "right" });
  currentY += 20;

  // Total - with highlight box instead of just a line
  const totalBoxY = currentY + 10;
  doc
    .fillColor(colors.light)
    .roundedRect(totalsBoxX - 10, totalBoxY - 5, totalsBoxWidth + 20, 40, 4)
    .fill();
  doc
    .fillColor(colors.primary)
    .rect(totalsBoxX - 10, totalBoxY - 5, 4, 40)
    .fill(); // Left accent border

  doc
    .fontSize(12)
    .fillColor(colors.dark)
    .text("TOTAL:", totalsBoxX, totalBoxY + 10);
  doc
    .fontSize(16)
    .fillColor(colors.primary)
    .text(formatCurrency(total), totalsBoxX + 100, totalBoxY + 8, { align: "right" });

  // === Notes, Terms, and Signature Section ===
  const notesY = Math.max(yPos + 100, totalBoxY + 60);

  // Notes section with subtle box
  doc.fillColor(colors.light).roundedRect(50, notesY, 240, 80, 4).fill();
  doc
    .fontSize(11)
    .fillColor(colors.dark)
    .text("NOTES", 60, notesY + 10);
  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Thank you for your business!", 60, notesY + 30, { width: 220 });

  // Bank account or Terms based on payment status
  if (invoice.paymentStatus !== "paid") {
    // Payment instructions for unpaid/partial dengan aksen merah untuk unpaid
    doc
      .fillColor(colors.light)
      .roundedRect(50, notesY + 100, 240, 100, 4)
      .fill();

    // Berikan tanda visual tebal berbeda untuk unpaid vs partial
    if (invoice.paymentStatus === "unpaid") {
      doc
        .fillColor(colors.danger)
        .rect(50, notesY + 100, 5, 100)
        .fill(); // Tebal merah untuk unpaid
      doc
        .fontSize(11)
        .fillColor(colors.danger)
        .text("PAYMENT REQUIRED", 60, notesY + 110);
    } else {
      doc
        .fillColor(colors.warning)
        .rect(50, notesY + 100, 4, 100)
        .fill(); // Aksen orange untuk partial
      doc
        .fontSize(11)
        .fillColor(colors.warning)
        .text("PARTIAL PAYMENT RECEIVED", 60, notesY + 110);
    }

    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text(bankInfo.accountName, 60, notesY + 130)
      .text(bankInfo.bank, 60, notesY + 145)
      .text(`NO. REK: ${bankInfo.accountNumber}`, 60, notesY + 160);

    // Tambah stempel "UNPAID" untuk invoice yang belum dibayar
    if (invoice.paymentStatus === "unpaid") {
      // Stempel diagonal "UNPAID" di background
      doc
        .save()
        .translate(300, 400)
        .rotate(-45, { origin: [0, 0] })
        .fontSize(60)
        .fillColor(colors.danger + "30") // Transparansi 30%
        .text("UNPAID", 0, 0)
        .restore();

      doc
        .fontSize(9)
        .fillColor(colors.danger)
        .text("Please make payment within 14 days of invoice date.", 60, notesY + 180);
    } else if (invoice.paymentStatus === "partial") {
      doc
        .fontSize(9)
        .fillColor(colors.warning)
        .text("Please complete the remaining payment.", 60, notesY + 180);
    }
  } else {
    // Terms for paid invoices dengan aksen hijau
    doc
      .fillColor(colors.light)
      .roundedRect(50, notesY + 100, 240, 60, 4)
      .fill();
    doc
      .fillColor(colors.success)
      .rect(50, notesY + 100, 4, 60)
      .fill(); // Aksen hijau
    doc
      .fontSize(11)
      .fillColor(colors.success)
      .text("PAYMENT RECEIVED", 60, notesY + 110);
    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text("Thank you for your prompt payment.", 60, notesY + 130, { width: 220 });

    // Stempel diagonal "PAID" di background untuk invoice yang sudah dibayar
    doc
      .save()
      .translate(300, 400)
      .rotate(-45, { origin: [0, 0] })
      .fontSize(60)
      .fillColor(colors.success + "20") // Transparansi 20%
      .text("PAID", 0, 0)
      .restore();
  }

  // Signature section
  doc.fillColor(colors.light).roundedRect(350, notesY, 200, 120, 4).fill();
  doc
    .fontSize(11)
    .fillColor(colors.dark)
    .text("Best Regards,", 370, notesY + 20);

  // Space for signature
  doc
    .rect(370, notesY + 40, 150, 1)
    .strokeColor(colors.secondary)
    .stroke();

  // Salesperson name
  doc
    .fontSize(10)
    .fillColor(colors.dark)
    .text(salespersonName, 370, notesY + 60);
  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Finance Department", 370, notesY + 75);

  // Simple and elegant footer
  doc
    .fontSize(8)
    .fillColor(colors.secondary)
    .text(`Issued by PT Excellent Inventory Pro | Page 1 of 1`, 50, doc.page.height - 40, { align: "center", width: 500 });

  // Subtle footer line
  doc
    .moveTo(50, doc.page.height - 50)
    .lineTo(550, doc.page.height - 50)
    .strokeColor(colors.lightBorder)
    .stroke();

  // End the document
  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);
  });
};
