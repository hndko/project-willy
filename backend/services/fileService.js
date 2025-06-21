const fs = require("fs");
const path = require("path");

// Fungsi delete file
exports.deleteFile = (filename) => {
  if (!filename) {
    return;
  }

  const filePath = path.join(__dirname, "../public/uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Delete file ${filename}:`, err.message);
    } else {
      console.log(`Succes delete file: ${filename}`);
    }
  });
};
