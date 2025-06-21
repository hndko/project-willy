const { Stock, Product, RawMaterial } = require("../models");
const { Op } = require("sequelize");

// CREATE
exports.createStock = async (data, transaction = null) => {
  return await Stock.create(data, { transaction });
};

// GET ALL
exports.getAllStocks = async (query) => {
  const { search = "", limit = 10, page = 1, type = null, hasProduct = false, hasMaterial = false } = query;
  const offset = (page - 1) * limit;

  let condition = {};

  if (search) {
    condition = {
      [Op.or]: [{ type: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }, { "$Product.name$": { [Op.like]: `%${search}%` } }, { "$RawMaterial.name$": { [Op.like]: `%${search}%` } }],
    };
  }

  if (type) {
    condition.type = type;
  }

  // Add filtering by entity type
  if (hasProduct === "true" || hasProduct === true) {
    condition.productId = { [Op.ne]: null };
  }

  if (hasMaterial === "true" || hasMaterial === true) {
    condition.rawMaterialId = { [Op.ne]: null };
  }

  const stocks = await Stock.findAndCountAll({
    where: condition,
    include: [
      { model: Product, attributes: ["id", "name", "stock"] },
      { model: RawMaterial, attributes: ["id", "name", "stock", "unit"] },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: stocks.count,
    totalPages: Math.ceil(stocks.count / limit),
    currentPage: parseInt(page),
    stocks: stocks.rows,
  };
};

// GET DETAIL
exports.getStockById = async (id) => {
  return await Stock.findByPk(id, {
    include: [
      { model: Product, attributes: ["id", "name", "stock"] },
      { model: RawMaterial, attributes: ["id", "name", "stock", "unit"] },
    ],
  });
};

// SEARCH + REPORT
exports.searchStocks = async (query) => {
  const { search, limit = 10, page = 1, startDate, endDate, type = null, hasProduct = false, hasMaterial = false } = query;

  const options = {
    include: [
      { model: Product, attributes: ["id", "name", "stock"] },
      { model: RawMaterial, attributes: ["id", "name", "stock", "unit"] },
    ],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [["createdAt", "DESC"]],
    where: {},
  };

  if (search) {
    options.where = {
      ...options.where,
      [Op.or]: [{ type: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }, { "$Product.name$": { [Op.like]: `%${search}%` } }, { "$RawMaterial.name$": { [Op.like]: `%${search}%` } }],
    };
  }

  if (type) {
    options.where.type = type;
  }

  if (startDate && endDate) {
    options.where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Add filtering by entity type
  if (hasProduct === "true" || hasProduct === true) {
    options.where.productId = { [Op.ne]: null };
  }

  if (hasMaterial === "true" || hasMaterial === true) {
    options.where.rawMaterialId = { [Op.ne]: null };
  }

  return await Stock.findAndCountAll(options);
};

// UPDATE
exports.updateStock = async (id, data, transaction = null) => {
  return await Stock.update(data, { where: { id }, transaction });
};

// DELETE
exports.deleteStock = async (id, transaction = null) => {
  return await Stock.destroy({ where: { id }, transaction });
};
