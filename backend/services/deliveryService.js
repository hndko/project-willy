const { Delivery, Sale, User, Customer, Product } = require("../models");
const { Op } = require("sequelize");

// CREATE
exports.createDelivery = async (data) => {
  try {
    console.log(`[DeliveryService] Creating delivery with data:`, JSON.stringify(data));

    // Validate required fields
    if (!data.saleId) {
      console.error("[DeliveryService] Missing required field: saleId");
      throw new Error("Sale ID is required");
    }

    if (!data.userId) {
      console.error("[DeliveryService] Missing required field: userId");
      throw new Error("User ID is required");
    }

    if (!data.shippingAddress) {
      console.error("[DeliveryService] Missing required field: shippingAddress");
      throw new Error("Shipping address is required");
    }

    // Perform database operation with proper error handling
    try {
      const delivery = await Delivery.create(data);
      console.log(`[DeliveryService] Delivery created successfully with ID: ${delivery.id}`);
      return delivery;
    } catch (dbError) {
      // Handle Sequelize-specific errors (like foreign key constraints)
      if (dbError.name === "SequelizeForeignKeyConstraintError") {
        console.error(`[DeliveryService] Foreign key constraint error:`, dbError.message);
        throw new Error("Referenced sale or user not found in database");
      }
      throw dbError;
    }
  } catch (error) {
    console.error(`[DeliveryService] Error creating delivery:`, error);
    console.error(`[DeliveryService] Error stack:`, error.stack);
    throw error;
  }
};

// Get All
exports.getAllDeliveries = async (query) => {
  const { search = "", limit = 10, page = 1, status = "", month = "", sort = null, countByStatus = false } = query;
  const offset = (page - 1) * limit;

  let condition = {};
  let order = [["created_at", "DESC"]];

  // Handle search condition - use separate conditions for better index usage
  if (search) {
    condition = {
      [Op.or]: [{ "$Sale.Product.name$": { [Op.like]: `%${search}%` } }, { "$Sale.Customer.name$": { [Op.like]: `%${search}%` } }, { "$User.name$": { [Op.like]: `%${search}%` } }, { courier: { [Op.like]: `%${search}%` } }, { tracking_number: { [Op.like]: `%${search}%` } }],
    };
  }

  // Handle status filtering
  if (status) {
    condition.status = status;
  }

  // Handle month filtering
  if (month) {
    try {
      // Parse the month format (expected: YYYY-MM)
      const [year, monthNum] = month.split("-");

      if (year && monthNum) {
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month

        condition.created_at = {
          [Op.between]: [startDate, endDate],
        };
      }
    } catch (error) {
      console.error("Error parsing month filter:", error);
    }
  }

  // Handle custom sorting - optimize to prevent slow sorting
  if (sort) {
    try {
      const sortParams = JSON.parse(sort);
      if (Array.isArray(sortParams) && sortParams.length > 0) {
        // Limit to top 2 sort fields for performance
        order = sortParams.slice(0, 2).map((param) => {
          // Handle nested fields like Sale.Product.name
          if (param.field.includes(".")) {
            const parts = param.field.split(".");
            return [{ model: parts[0] }, ...parts.slice(1), param.order];
          }
          return [param.field, param.order];
        });
      }
    } catch (error) {
      console.error("Error parsing sort parameter:", error);
    }
  }

  // If counting by status is requested - use optimized count queries
  if (countByStatus) {
    const counts = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    // Get all counts in a single query where possible
    const statusCounts = await Delivery.findAll({
      attributes: ["status", [Delivery.sequelize.fn("COUNT", Delivery.sequelize.col("id")), "count"]],
      where: { ...condition },
      group: ["status"],
      raw: true,
    });

    // Set initial total
    counts.total = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Map counts by status
    statusCounts.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] = parseInt(item.count);
      }
    });

    return { statusCounts: counts };
  }

  // Optimize includes to only return essential fields
  const includes = [
    {
      model: Sale,
      required: false, // Make this a LEFT JOIN instead of INNER JOIN for performance
      attributes: ["id"],
      include: [
        {
          model: Product,
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Customer,
          attributes: ["id", "name"],
          required: false,
        },
      ],
    },
    {
      model: User,
      attributes: ["id", "name"],
      required: false,
    },
  ];

  // Regular query with pagination - optimize with separate count query
  // First run a faster count query without includes
  const count = await Delivery.count({
    where: condition,
    distinct: true,
    col: "id",
  });

  // Then run the main query with includes
  const deliveries = await Delivery.findAll({
    where: condition,
    include: includes,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: order,
    // Add query hint to optimize for fast display
    attributes: {
      include: [],
      // Exclude large text fields if not needed
      exclude: search.length > 0 ? [] : ["notes"],
    },
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    deliveries: deliveries,
  };
};

// Get By ID
exports.getDeliveryById = async (id) => {
  return await Delivery.findByPk(id, {
    include: [
      {
        model: Sale,
        include: [
          { model: Product, attributes: ["id", "name"] },
          { model: Customer, attributes: ["id", "name"] },
        ],
      },
      { model: User, attributes: ["id", "name"] },
    ],
  });
};

// Get By Sale ID
exports.getDeliveryBySaleId = async (saleId) => {
  try {
    console.log(`[DeliveryService] Fetching delivery for sale ID: ${saleId}, type: ${typeof saleId}`);

    if (!saleId) {
      console.error("[DeliveryService] Invalid saleId provided:", saleId);
      throw new Error("Sale ID is required");
    }

    // Ensure saleId is properly formatted if it's a UUID
    let formattedSaleId = saleId;

    // Run the query
    console.log(`[DeliveryService] Querying database with sale_id:`, formattedSaleId);
    const delivery = await Delivery.findOne({
      where: { sale_id: formattedSaleId },
      include: [{ model: User, attributes: ["id", "name"] }],
    });

    console.log(`[DeliveryService] Delivery found for sale ${saleId}:`, delivery ? "yes" : "no");
    return delivery;
  } catch (error) {
    console.error(`[DeliveryService] Error fetching delivery for sale ${saleId}:`, error);
    console.error(`[DeliveryService] Error stack:`, error.stack);
    throw error;
  }
};

// Update
exports.updateDelivery = async (id, data) => {
  const [updatedRows] = await Delivery.update(data, {
    where: { id },
  });

  if (updatedRows === 0) return null;

  return await Delivery.findByPk(id);
};

// Delete
exports.deleteDelivery = async (id) => {
  return await Delivery.destroy({ where: { id } });
};
