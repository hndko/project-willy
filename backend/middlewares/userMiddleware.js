const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

// Middleware untuk memastikan anda sudah login atau belum
exports.authMiddleware = async (req, res, next) => {
  let token;
  token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "You are not logged in, token is not available.",
    });
  }

  let decoded;
  try {
    decoded = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(err);
  }

  // Handle findByPk or alternative find method
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    const error = new Error("User not found or has been deleted.");
    error.statusCode = 401;
    return next(error);
  }

  req.user = currentUser;

  next();
};

// Middleware Permission Rule User
exports.permissionUser = (...roles) => {
  return async (req, res, next) => {
    try {
      const role = await Role.findByPk(req.user.role_id);
      if (!role) {
        return res.status(404).json({ message: "User role not found." });
      }
      if (!roles.includes(role.name)) {
        return res.status(403).json({ message: `Access denied: Only [${roles.join(", ")}] can access this endpoint.` });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
