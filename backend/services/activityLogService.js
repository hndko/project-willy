const { ActivityLog, User } = require("../models");
const { Op } = require("sequelize");

// CREATE activity log
exports.createActivityLog = async (payload, options = {}) => {
  return await ActivityLog.create(payload, options);
};

// GET ALL with search + pagination
exports.getAllActivityLogs = async (query) => {
  const { search = "", limit = 10, page = 1, action, startDate, endDate } = query;
  const offset = (page - 1) * limit;

  // Build where conditions based on filters
  const where = {};

  // Search filter
  if (search) {
    where[Op.or] = [{ action: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }, { table: { [Op.like]: `%${search}%` } }];
  }

  // Action filter - now accepts partial matches
  if (action) {
    const actionLower = action.toLowerCase();
    if (actionLower === "create" || actionLower === "update" || actionLower === "delete") {
      where.action = { [Op.like]: `%${actionLower}%` };
    }
  }

  // Date range filter
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    where.createdAt = {
      [Op.gte]: new Date(startDate),
    };
  } else if (endDate) {
    where.createdAt = {
      [Op.lte]: new Date(endDate),
    };
  }

  const logs = await ActivityLog.findAndCountAll({
    where,
    include: {
      model: User,
      attributes: ["id", "name", "email"],
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: logs.count,
    totalPages: Math.ceil(logs.count / limit),
    currentPage: parseInt(page),
    logs: logs.rows,
  };
};

// GET by ID
exports.getActivityLogById = async (id) => {
  return await ActivityLog.findByPk(id, {
    include: {
      model: User,
      attributes: ["id", "name", "email"],
    },
  });
};

// UPDATE
exports.updateActivityLog = async (id, payload) => {
  return await ActivityLog.update(payload, { where: { id } });
};

// DELETE
exports.deleteActivityLog = async (id) => {
  return await ActivityLog.destroy({ where: { id } });
};
