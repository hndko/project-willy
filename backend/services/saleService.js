const { Sale, Product, User, Customer, Delivery, Invoice, sequelize } = require("../models");
const { Op } = require("sequelize");

// CREATE
exports.createSale = async (data) => {
  return await Sale.create(data);
};

// Get All
exports.getAllSales = async (query) => {
  const { search = "", limit = 10, page = 1, month = "", paymentStatus = "", deliveryStatus = "" } = query;

  const offset = (page - 1) * limit;

  let condition = {};

  if (search) {
    condition = {
      [Op.or]: [{ "$Product.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }, { "$Customer.name$": { [Op.like]: `%${search}%` } }, { date: { [Op.like]: `%${search}%` } }],
    };
  }

  // Add month filter if present
  if (month) {
    const [year, monthNum] = month.split("-").map((num) => parseInt(num, 10));

    // Create date range for the selected month
    const startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed in JavaScript
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    condition.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  // Add payment status filter directly to the main condition
  if (paymentStatus) {
    condition.payment_status = paymentStatus;
  }

  const includeOptions = [
    { model: Product, attributes: ["id", "name", "price"] },
    { model: User, attributes: ["id", "name"] },
    { model: Customer, attributes: ["id", "name"] },
    { model: Delivery },
    { model: Invoice, attributes: ["id", "invoiceNumber", "payment_status", "payment_date", "payment_method"] },
  ];

  // Handle search separately if present
  let searchOptions = {};
  if (search) {
    searchOptions = {
      include: [
        {
          model: Product,
          where: {
            name: {
              [Op.like]: `%${search}%`,
            },
          },
          required: false,
        },
        {
          model: User,
          where: {
            name: {
              [Op.like]: `%${search}%`,
            },
          },
          required: false,
        },
        {
          model: Customer,
          where: {
            name: {
              [Op.like]: `%${search}%`,
            },
          },
          required: false,
        },
      ],
      where: {
        [Op.or]: [
          { date: { [Op.like]: `%${search}%` } },
          // Add a sequelize.literal
          sequelize.literal(`(EXISTS (SELECT 1 FROM Products WHERE Products.id = Sale.product_id AND Products.name LIKE '%${search}%') OR
            EXISTS (SELECT 1 FROM Users WHERE Users.id = Sale.user_id AND Users.name LIKE '%${search}%') OR
            EXISTS (SELECT 1 FROM Customers WHERE Customers.id = Sale.customer_id AND Customers.name LIKE '%${search}%'))`),
        ],
      },
    };
  }
  // Add delivery status filter if present
  if (deliveryStatus) {
    includeOptions.find((inc) => inc.model === Delivery).where = {
      status: deliveryStatus,
    };
  }

  try {
    // Build final query
    const queryOptions = {
      where: condition,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date", "DESC"]],
      distinct: true,
    };

    // Merge search options if present
    if (search && searchOptions.where) {
      queryOptions.where = {
        ...queryOptions.where,
        ...searchOptions.where,
      };
    }
    const sales = await Sale.findAndCountAll(queryOptions);
    return {
      totalItems: sales.count,
      totalPages: Math.ceil(sales.count / limit),
      currentPage: parseInt(page),
      sales: sales.rows,
    };
  } catch (error) {
    throw error;
  }
};

exports.getSaleById = async (id) => {
  try {
    if (!id) {
      throw new Error("Sale ID is required");
    }

    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: Product,
          attributes: ["id", "name", "price", "stock"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Customer,
          attributes: ["id", "name", "email", "phone", "address"],
        },
        {
          model: Delivery,
          // Include all attributes
        },
        {
          model: Invoice,
          attributes: ["id", "invoiceNumber", "date", "payment_status", "payment_date", "payment_method", "total"],
        },
      ],
    });

    return sale;
  } catch (error) {
    throw error;
  }
};

exports.updateSale = async (id, data) => {
  const [updatedRows] = await Sale.update(data, {
    where: { id },
  });

  if (updatedRows === 0) return null;

  return await Sale.findByPk(id); // return hasil update-nya
};

exports.deleteSale = async (id) => {
  return await Sale.destroy({ where: { id } });
};
