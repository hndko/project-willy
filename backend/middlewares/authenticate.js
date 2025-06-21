const jwt = require("jsonwebtoken");
const { User } = require("../models");
const ApiError = require("../utils/apiError");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Unauthorized access. Please login."));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is valid and not expired
    if (!decoded) {
      return next(new ApiError(401, "Invalid token"));
    }

    // Find the user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new ApiError(401, "User with this token no longer exists"));
    }

    if (!user.is_active) {
      return next(new ApiError(401, "User account has been deactivated"));
    }

    // Set user on request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }
    return next(error);
  }
};
