const { User, Role } = require("../models");

// Get all users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, attributes: ["id", "name"] }],
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({ status: "success", data: users });
  } catch (err) {
    next(err);
  }
};

// Get user by id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, attributes: ["id", "name"] }],
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ status: "success", data: user });
  } catch (err) {
    next(err);
  }
};

// Create user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, role_id, is_active, password } = req.body;
    if (!name || !email || !phone || !role_id) {
      return res.status(400).json({ message: "Name, email, phone, and role are required" });
    }
    if (phone.length < 10) {
      return res.status(400).json({ message: "Phone number must be at least 10 digits" });
    }
    // Cek email unik
    const exist = await User.findOne({ where: { email } });
    if (exist) return res.status(400).json({ message: "Email already exists" });
    // Cek role valid
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(400).json({ message: "Role not found" });
    // Password default jika tidak diisi
    const user = await User.create({
      name,
      email,
      phone,
      role_id,
      is_active: is_active !== undefined ? is_active : true,
      username: email,
      password: password || "password123", // Default password jika tidak diisi
    });
    res.status(201).json({ status: "success", data: user });
  } catch (err) {
    next(err);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, role_id, is_active } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Cegah admin/owner nonaktifkan dirinya sendiri
    if (is_active === false && req.user && req.user.id === user.id) {
      // Cek role user
      const role = await Role.findByPk(user.role_id);
      if (role && (role.name === "admin" || role.name === "owner")) {
        return res.status(403).json({ message: "Admin/Owner tidak bisa menonaktifkan akunnya sendiri" });
      }
    }
    if (email && email !== user.email) {
      const exist = await User.findOne({ where: { email } });
      if (exist) return res.status(400).json({ message: "Email already exists" });
      user.email = email;
    }
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) return res.status(400).json({ message: "Role not found" });
      user.role_id = role_id;
    }
    if (name) user.name = name;
    if (phone) {
      if (phone.length < 10) return res.status(400).json({ message: "Phone number must be at least 10 digits" });
      user.phone = phone;
    }
    if (is_active !== undefined) user.is_active = is_active;
    await user.save();
    res.status(200).json({ status: "success", data: user });
  } catch (err) {
    next(err);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    res.status(200).json({ status: "success", message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
