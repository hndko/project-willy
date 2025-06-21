const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, updateProfilePicture, updatePassword } = require("../controllers/profileController");
const { authMiddleware } = require("../middlewares/userMiddleware");
const { handleProfilePictureUpload } = require("../middlewares/fileUploadMiddleware");

// GET User Profile
router.get("/", authMiddleware, getProfile);

// PUT Update Profile
router.put("/", authMiddleware, updateProfile);

// PUT Update Profile Picture
router.put("/picture", authMiddleware, handleProfilePictureUpload, updateProfilePicture);

// PUT Update Password
router.put("/password", authMiddleware, updatePassword);

module.exports = router;
