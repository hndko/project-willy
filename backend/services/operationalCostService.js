const { OperationalCost, User } = require("../models");
const { Op } = require("sequelize");

// Create OP Cost
exports.createOperationalCost = async (data) => {
  return await OperationalCost.create(data);
};

// GET Find ALL and Search Keyword
exports.getAllOperationalCosts = async (query) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  let condition = {};
  if (search) {
    condition = {
      [Op.or]: [{ title: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }, { userId: { [Op.like]: `%${search}%` } }],
    };
  }

  const costs = await OperationalCost.findAndCountAll({
    where: condition,
    include: [{ model: User, attributes: ["id", "name"] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: costs.count,
    totalPages: Math.ceil(costs.count / limit),
    currentPage: parseInt(page),
    operationalCosts: costs.rows,
  };
};

// GET OP Cost By Id
exports.getOperationalCostById = async (id) => {
  return await OperationalCost.findByPk(id, {
    include: [{ model: User, attributes: ["id", "name"] }],
  });
};

//Update OP Cost
exports.updateOperationalCost = async (id, data) => {
  await OperationalCost.update(data, { where: { id } });
  return await OperationalCost.findByPk(id, {
    include: [{ model: User, attributes: ["id", "name"] }],
  });
};

// Delete OP Cost
exports.deleteOperationalCost = async (id) => {
  return await OperationalCost.destroy({ where: { id } });
};
