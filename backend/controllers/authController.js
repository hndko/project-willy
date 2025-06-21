const { User, Role } = require("../models");
const jwt = require("jsonwebtoken");
const asyncHandle = require("../middlewares/asyncHandle");
const { createActivityLog } = require("../services/activityLogService");

// Fungsi sign jwt token
const signToken = (id) => {
  // Menampung jwt web token
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h", // expires 1 hari, add default if env var missing
  });
};

// Fungsi sign refresh token
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "refreshsecret", {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d", // default 7 hari
  });
};

// Fungsi respon token dan cookienya
const createSendToken = (User, statusCode, res) => {
  try {
    // token
    const token = signToken(User.id);
    const refreshToken = signRefreshToken(User.id);
    //cookie respons
    const cookieOption = {
      expires: new Date(Date.now() + parseInt(process.env.JWT_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000), // Milesecond
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // hanya https di production
    };
    const refreshCookieOption = {
      expires: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/", // bisa diakses di semua endpoint
    };
    // respons all
    res.cookie("jwt", token, cookieOption);
    res.cookie("refreshToken", refreshToken, refreshCookieOption);
    //not password
    if (User.password) {
      User.password = undefined;
    }

    // respons json
    res.status(statusCode).json({
      status: "Success",
      data: {
        User,
        token: token, // Include token explicitly in response
        refreshToken: refreshToken, // Include refresh token explicitly in response (opsional)
      },
    });
  } catch (error) {
    console.error("Error in createSendToken:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate authentication token",
    });
  }
};

// Fungsi register User
exports.registerUser = asyncHandle(async (req, res, next) => {
  try {
    console.log("MASUK CONTROLLER REGISTER");

    const { username, name, email, phone, password, passwordConfirm } = req.body;

    console.log("BODY DARI FRONTEND:", req.body);

    // Validasi password confirm
    if (password !== passwordConfirm) {
      const error = new Error("Password dan Konfirmasi Password tidak cocok");
      error.statusCode = 400;
      return next(error); // lempar error ke middleware
    }

    // Cek apakah email sudah digunakan
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      const error = new Error("Email sudah terdaftar");
      error.statusCode = 400;
      return next(error);
    }

    // Cek apakah username sudah digunakan
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      const error = new Error("Username sudah terdaftar");
      error.statusCode = 400;
      return next(error);
    }

    // Validation phone
    if (!phone || phone.trim().length < 10) {
      const error = new Error("Nomor telepon wajib diisi dan minimal 10 karakter");
      error.statusCode = 400;
      return next(error);
    }

    // Create user baru
    const newUser = await User.create({
      username,
      name: name || username, // Gunakan username jika name kosong
      email,
      phone: phone || null,
      password,
    });

    // Log activity for new user registration
    await createActivityLog({
      userId: newUser.id,
      table: "User",
      action: "User Registration",
      description: `New user registered: ${username}`,
    });

    // Kirim response dengan token
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error("Register Error:", error);
    next(error); // langsung lempar ke errorHandler global
  }
});

// Fungsi Login User
exports.loginUser = asyncHandle(async (req, res, next) => {
  try {
    console.log("Login attempt with:", { email: req.body.email, requestBody: req.body });

    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Mohon masukkan Email dan Password!");
      error.statusCode = 400;
      return next(error);
    }

    const userData = await User.findOne({ where: { email } });

    if (!userData) {
      console.log("❌ Email tidak ditemukan:", email);
      const error = new Error("Email atau Password salah");
      error.statusCode = 400;
      return next(error);
    }

    // Tambahkan pengecekan status aktif
    if (!userData.is_active) {
      const error = new Error("Akun Anda tidak aktif, hubungi admin.");
      error.statusCode = 403;
      return next(error);
    }

    console.log("✅ User ditemukan:", userData.email);

    // Don't log sensitive data like passwords, but log that we're checking
    console.log("Checking password match...");

    const isMatch = await userData.correctPassword(password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      const error = new Error("Email atau Password salah");
      error.statusCode = 400;
      return next(error);
    }

    // Log successful login activity
    await createActivityLog({
      userId: userData.id,
      table: "User",
      action: "User Login",
      description: `User ${userData.username} logged in`,
    });

    console.log("✅ Login successful, creating token...");
    createSendToken(userData, 200, res);
  } catch (err) {
    console.error("Login Error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan login",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

// Fungsi Logout User
exports.logoutUser = async (req, res) => {
  try {
    // Log logout activity if user is authenticated
    if (req.user && req.user.id) {
      await createActivityLog({
        userId: req.user.id,
        table: "User",
        action: "User Logout",
        description: `User logged out`,
      });
    }

    //Kita ambil jwtnya dan diubah menjadi kosong.
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      message: "Logout Berhasil",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat logout",
    });
  }
};

// Fungsi Current User
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ["password", "role_id", "createdAt", "updatedAt"],
      },
      include: [
        {
          model: Role,
          attributes: ["id", "name"], // Assosiasi user role
        },
      ],
    });

    if (!user) {
      const error = new Error("User tidak ditemukan.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Endpoint untuk refresh token
exports.refreshToken = asyncHandle(async (req, res, next) => {
  try {
    // Ambil refresh token dari cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ status: "error", message: "Refresh token tidak ditemukan" });
    }
    // Verifikasi refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refreshsecret");
    } catch (err) {
      return res.status(401).json({ status: "error", message: "Refresh token tidak valid atau expired" });
    }
    // Cari user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ status: "error", message: "User tidak ditemukan" });
    }
    // Generate access token baru
    const newAccessToken = signToken(user.id);
    // Set cookie baru untuk access token (opsional, atau kirim di response)
    res.cookie("jwt", newAccessToken, {
      expires: new Date(Date.now() + parseInt(process.env.JWT_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    // Kirim access token baru
    res.status(200).json({
      status: "success",
      token: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
});
