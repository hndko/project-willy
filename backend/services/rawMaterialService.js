const { RawMaterial } = require("../models");
const { Op } = require("sequelize");

exports.createRawMaterial = (data) => {
  return RawMaterial.create(data);
};

exports.getAllRawMaterials = async (query) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  let condition = {};
  if (search) {
    condition = {
      name: { [Op.like]: `%${search}%` },
    };
  }

  const materials = await RawMaterial.findAndCountAll({
    where: condition,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: materials.count,
    totalPages: Math.ceil(materials.count / limit),
    currentPage: parseInt(page),
    rawMaterials: materials.rows,
  };
};

exports.getRawMaterialById = (id) => {
  return RawMaterial.findByPk(id);
};

exports.updateRawMaterial = (id, data) => {
  return RawMaterial.update(data, { where: { id } });
};

exports.deleteRawMaterial = (id) => {
  return RawMaterial.destroy({ where: { id } });
};
