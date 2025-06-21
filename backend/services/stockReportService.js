const { Op } = require("sequelize");
const { Stock, Product, RawMaterial } = require("../models");

async function getStockReport({ search, type, startDate, endDate, page = 1, limit = 10 }) {
  const where = {};

  // Filter by type
  if (type) where.type = type;

  // Filter by search (product name or description)
  if (search) {
    where[Op.or] = [{ description: { [Op.like]: `%${search}%` } }, { "$Product.name$": { [Op.like]: `%${search}%` } }, { "$RawMaterial.name$": { [Op.like]: `%${search}%` } }];
  }

  // Filter by date
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate);
  }

  // Pagination
  const offset = (page - 1) * limit;

  // Query data
  const { rows, count } = await Stock.findAndCountAll({
    where,
    include: [
      { model: Product, attributes: ["id", "name", "stock"] },
      { model: RawMaterial, attributes: ["id", "name", "stock", "unit"] },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });

  // Statistik
  const stats = await getStockStats(where);

  return {
    data: rows,
    totalData: count,
    stats,
  };
}

// Statistik stok
async function getStockStats(baseWhere) {
  // Copy baseWhere untuk setiap type
  const types = ["in", "out", "expired", "reject"];
  const stats = {};

  for (const t of types) {
    const where = { ...baseWhere, type: t };
    stats[t === "reject" ? "rejected" : t === "expired" ? "expired" : t === "in" ? "stockIn" : "stockOut"] = (await Stock.sum("stock", { where })) || 0;
  }

  return stats;
}

module.exports = {
  getStockReport,
};
