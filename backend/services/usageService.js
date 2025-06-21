const { Usage, RawMaterial, User } = require("../models");
const { Op } = require("sequelize");

// GET ALL USAGES with search and pagination
exports.getAllUsages = async (query) => {
  const { search, limit, page } = query;

  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  // Jika keyword diisi, lakukan pencarian pada field yang relevan
  let condition = {};
  if (search) {
    condition = {
      [Op.or]: [{ "$RawMaterial.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }, { date: { [Op.like]: `%${search}%` } }],
    };
  }

  const usages = await Usage.findAndCountAll({
    where: condition,
    limit: limitNumber,
    offset: offset,
    include: [
      { model: RawMaterial, attributes: ["id", "name", "unit"] },
      { model: User, attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
    attributes: ["id", "raw_material_id", "user_id", "qty", "date", "description", "createdAt", "updatedAt"],
  });

  return {
    totalItems: usages.count,
    totalPages: Math.ceil(usages.count / limitNumber),
    currentPage: pageNumber,
    usages: usages.rows,
  };
};

// GET USAGE BY ID
exports.getUsageById = async (id) => {
  return await Usage.findByPk(id, {
    include: [
      { model: RawMaterial, attributes: ["id", "name", "unit"] },
      { model: User, attributes: ["id", "name"] },
    ],
    attributes: ["id", "raw_material_id", "user_id", "qty", "date", "description", "createdAt", "updatedAt"],
  });
};

// CREATE NEW USAGE
exports.createUsage = async (usageData) => {
  // Ambil data raw material
  const rawMaterial = await RawMaterial.findByPk(usageData.rawMaterialId);
  if (!rawMaterial) {
    const error = new Error("Raw material not found");
    error.statusCode = 404;
    throw error;
  }
  if (usageData.qty > rawMaterial.stock) {
    const error = new Error(`Usage quantity (${usageData.qty}) exceeds available stock (${rawMaterial.stock})`);
    error.statusCode = 400;
    throw error;
  }
  return await Usage.create(usageData);
};

// UPDATE USAGE
exports.updateUsage = async (id, usageData) => {
  // Ambil usage lama
  const oldUsage = await Usage.findByPk(id);
  if (!oldUsage) {
    const error = new Error("Usage not found");
    error.statusCode = 404;
    throw error;
  }
  // Ambil data raw material
  const rawMaterial = await RawMaterial.findByPk(usageData.rawMaterialId);
  if (!rawMaterial) {
    const error = new Error("Raw material not found");
    error.statusCode = 404;
    throw error;
  }
  // Hitung selisih qty
  const qtyDiff = usageData.qty - oldUsage.qty;
  // Jika qty bertambah, pastikan stock cukup
  if (qtyDiff > 0 && qtyDiff > rawMaterial.stock) {
    const error = new Error(`Usage quantity increase (${qtyDiff}) exceeds available stock (${rawMaterial.stock})`);
    error.statusCode = 400;
    throw error;
  }
  // Update stock raw material
  rawMaterial.stock -= qtyDiff;
  if (rawMaterial.stock < 0) {
    const error = new Error("Stock cannot be negative after update");
    error.statusCode = 400;
    throw error;
  }
  await rawMaterial.save();
  await Usage.update(usageData, { where: { id } });
  return await Usage.findByPk(id);
};

// DELETE USAGE
exports.deleteUsage = async (id) => {
  return await Usage.destroy({ where: { id } });
};
