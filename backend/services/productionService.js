const { Production, Product, User, BoM, RawMaterial, sequelize } = require("../models");
const { createActivityLog } = require("./activityLogService");
const { Op } = require("sequelize");

// Get all productions (optionally by filter, now with pagination and search)
exports.getAllProductions = async (query = {}) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  let where = {};
  if (search) {
    where = {
      [Op.or]: [{ "$Product.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }],
    };
  }

  const { count, rows } = await Production.findAndCountAll({
    where,
    include: [
      { model: Product, attributes: ["id", "name", "cost_price", "stock"] },
      { model: User, attributes: ["id", "username", "name"] },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["production_date", "DESC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    productions: rows,
  };
};

// Get production by ID
exports.getProductionById = async (id) => {
  return await Production.findByPk(id, {
    include: [
      { model: Product, attributes: ["id", "name", "cost_price", "stock"] },
      { model: User, attributes: ["id", "username", "name"] },
    ],
  });
};

// Create production (planned)
exports.createProduction = async (data) => {
  const prod = await Production.create(data);
  await createActivityLog({
    userId: data.user_id,
    table: "Production",
    action: "Create Production",
    description: `Created production for product ${prod.product_id} (qty: ${prod.qty})`,
  });
  return prod;
};

// Update production
exports.updateProduction = async (id, data) => {
  const prod = await Production.findByPk(id);
  if (!prod) return null;
  await prod.update(data);
  await createActivityLog({
    userId: data.user_id || prod.user_id,
    table: "Production",
    action: "Update Production",
    description: `Updated production for product ${prod.product_id} (qty: ${prod.qty})`,
  });
  return prod;
};

// Delete production
exports.deleteProduction = async (id) => {
  const prod = await Production.findByPk(id);
  if (!prod) return null;
  await prod.destroy();
  await createActivityLog({
    userId: prod.user_id,
    table: "Production",
    action: "Delete Production",
    description: `Deleted production for product ${prod.product_id} (qty: ${prod.qty})`,
  });
  return true;
};

// Process production (mark as done, update stock, calculate HPP)
exports.processProduction = async (id, userId = null) => {
  // Transactional
  return await sequelize.transaction(async (t) => {
    const prod = await Production.findByPk(id, { transaction: t });
    if (!prod || prod.status === "done") return null;
    // Get BoM for product
    const bomList = await BoM.findAll({ where: { product_id: prod.product_id }, include: [RawMaterial], transaction: t });
    if (!bomList.length) throw new Error("BoM not found for this product");
    // Kurangi stok bahan baku, hitung total HPP
    let totalHPP = 0;
    for (const bom of bomList) {
      const material = bom.RawMaterial;
      const qtyNeeded = bom.qty * prod.qty;
      if (material.stock < qtyNeeded) throw new Error(`Stock bahan baku ${material.name} tidak cukup`);
      // Kurangi stok
      await material.update({ stock: material.stock - qtyNeeded }, { transaction: t });
      // Akumulasi HPP
      totalHPP += (material.price || 0) * qtyNeeded;
    }
    // Tambah stok produk
    const product = await Product.findByPk(prod.product_id, { transaction: t });
    await product.update({ stock: product.stock + prod.qty, cost_price: Math.round(totalHPP / prod.qty) }, { transaction: t });
    // Update produksi
    await prod.update({ status: "done", hpp: Math.round(totalHPP / prod.qty) }, { transaction: t });
    // Audit log
    await createActivityLog(
      {
        userId: userId || prod.user_id,
        table: "Production",
        action: "Process Production",
        description: `Processed production for product ${product.name} (qty: ${prod.qty})`,
      },
      { transaction: t }
    );
    return prod;
  });
};
