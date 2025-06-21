const { Role } = require("../models");

// Create Role
exports.createRole = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }
    // Cek unik
    const exist = await Role.findOne({ where: { name } });
    if (exist) {
      return res.status(400).json({ message: "Role name already exists" });
    }
    const role = await Role.create({ name });
    res.status(201).json({ status: "success", data: role });
  } catch (err) {
    next(err);
  }
};

// Get all roles
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll();
    res.status(200).json({ status: "success", data: roles });
  } catch (err) {
    next(err);
  }
};

// Get role by id
exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({ status: "success", data: role });
  } catch (err) {
    next(err);
  }
};

// Update role
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    // Cek unik jika nama diubah
    if (name && name !== role.name) {
      const exist = await Role.findOne({ where: { name } });
      if (exist) {
        return res.status(400).json({ message: "Role name already exists" });
      }
      role.name = name;
    }
    await role.save();
    res.status(200).json({ status: "success", data: role });
  } catch (err) {
    next(err);
  }
};

// Delete role
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    await role.destroy();
    res.status(200).json({ status: "success", message: "Role deleted" });
  } catch (err) {
    next(err);
  }
};
