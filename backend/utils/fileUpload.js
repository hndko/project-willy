const multer = require("multer");
const path = require("path");
const fs = require("fs");

const FILE_TYPE = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageFile = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValidFormat = FILE_TYPE[file.mimetype];
    let uploadError = new Error("Invalid Image Type");

    if (isValidFormat) {
      uploadError = null;
    }

    // Make sure directory exists again (just to be safe)
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        return cb(new Error("Could not create uploads directory: " + error.message), null);
      }
    }

    cb(uploadError, uploadDir); // Use the absolute path instead of relative path
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE[file.mimetype];
    if (!extension) {
      return cb(new Error("Unsupported file type"), null);
    }

    // variable untuk membuat nama file name imagenya.
    const uniqueFileImages = `${file.fieldname}-${Date.now()}.${extension}`;

    // Disini kita edit juga untuk callbakcnya. null karena tidak ada null
    cb(null, uniqueFileImages);
  },
});

// Add file size and type checking
const fileFilter = (req, file, cb) => {
  // Check if the file type is in our allowed list
  if (FILE_TYPE[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Supported types: PNG, JPG, JPEG"), false);
  }
};

exports.uploadOption = multer({
  storage: storageFile,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});
