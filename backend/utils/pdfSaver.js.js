const fs = require("fs");
const path = require("path");

// Fungsi bantu menyimpan stream PDF ke file
exports.savePDFToFile = (pdfDoc, filename) => {
  const outputDir = path.join(__dirname, "../public/invoices");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fullPath = path.join(outputDir, filename);
  const writeStream = fs.createWriteStream(fullPath);
  pdfDoc.pipe(writeStream);

  pdfDoc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(fullPath));
    writeStream.on("error", reject);
  });
};
