const multer = require("multer");
const { uploadOption } = require("../utils/fileUpload");

/**
 * Middleware to handle profile picture uploads
 * Handles file validation and error handling
 */
exports.handleProfilePictureUpload = (req, res, next) => {
  uploadOption.single("profile_picture")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            status: "error",
            message: "File too large, maximum size is 5MB",
          });
        }
        return res.status(400).json({
          status: "error",
          message: `Upload error: ${err.message}`,
        });
      } else {
        // An unknown error occurred
        return res.status(400).json({
          status: "error",
          message: err.message,
        });
      }
    }

    // If no file was provided
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Please select a profile picture file to upload",
      });
    }

    // If everything is fine, proceed to the controller
    next();
  });
};
