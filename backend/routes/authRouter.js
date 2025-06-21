const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, getCurrentUser, refreshToken } = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/userMiddleware");

// POST Register User
router.post("/register", registerUser);

// POST Login User
router.post("/login", loginUser);

//POST Logout User
router.post("/logout", authMiddleware, logoutUser);

//GET Current User
router.get("/me", authMiddleware, getCurrentUser);

// Endpoint refresh token
router.post("/refresh-token", refreshToken);

// Jangan lupa exports module
module.exports = router;
