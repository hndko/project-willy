const { Purchase, RawMaterial, Supplier, User } = require("../models");
const { Op } = require("sequelize");

exports.createPurchase = async (data) => {
  return await Purchase.create(data);
};

exports.getAllPurchases = async (query) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  let condition = {};

  if (search) {
    condition = {
      [Op.or]: [{ "$RawMaterial.name$": { [Op.like]: `%${search}%` } }, { "$Supplier.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }, { date: { [Op.like]: `%${search}%` } }],
    };
  }

  const purchases = await Purchase.findAndCountAll({
    where: condition,
    include: [
      { model: RawMaterial, attributes: ["id", "name", "unit"] },
      { model: Supplier, attributes: ["id", "name"] },
      { model: User, attributes: ["id", "name"] },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["date", "DESC"]],
  });

  return {
    totalItems: purchases.count,
    totalPages: Math.ceil(purchases.count / limit),
    currentPage: parseInt(page),
    purchases: purchases.rows,
  };
};

exports.getPurchaseById = async (id) => {
  return await Purchase.findByPk(id, {
    include: [RawMaterial, Supplier, User],
  });
};

exports.updatePurchase = async (id, data) => {
  return await Purchase.update(data, { where: { id } });
};

exports.deletePurchase = async (id) => {
  return await Purchase.destroy({ where: { id } });
};
