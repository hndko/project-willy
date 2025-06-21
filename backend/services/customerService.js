const { Customer } = require("../models");
const { Op } = require("sequelize");

exports.getAllCustomers = async (query) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  const data = await Customer.findAndCountAll({
    where: {
      [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }, { phone: { [Op.like]: `%${search}%` } }],
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: data.count,
    totalPages: Math.ceil(data.count / limit),
    currentPage: parseInt(page),
    customers: data.rows,
  };
};

exports.getCustomerById = async (id) => {
  return await Customer.findByPk(id);
};

exports.createCustomer = async (data) => {
  return await Customer.create(data);
};

exports.updateCustomer = async (id, data) => {
  await Customer.update(data, { where: { id } });
  return await Customer.findByPk(id);
};

exports.deleteCustomer = async (id) => {
  return await Customer.destroy({ where: { id } });
};
