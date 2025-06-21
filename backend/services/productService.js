const { Product, Category, Supplier } = require("../models");
const { Op } = require("sequelize");

// Get all products
// Find All Products with Search + Pagination
exports.getAllProducts = async (query) => {
  const { search = "", limit = 10, page = 1 } = query;
  const offset = (page - 1) * limit;

  const products = await Product.findAndCountAll({
    where: {
      name: { [Op.like]: `%${search}%` },
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: {
      exclude: ["categoryId", "supplierId", "category_id", "supplier_id"],
    },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: Supplier, attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: products.count,
    totalPages: Math.ceil(products.count / limit),
    currentPage: parseInt(page),
    products: products.rows,
  };
};

// Get product by ID
exports.getProductById = async (id) => {
  return await Product.findByPk(id, {
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: Supplier, attributes: ["id", "name"] },
    ],
  });
};

// Create new product
exports.createProduct = async (productData) => {
  return await Product.create(productData);
};

// Update product
exports.updateProduct = async (id, productData) => {
  await Product.update(productData, { where: { id } });
  return await Product.findByPk(id);
};

// Delete product
exports.deleteProduct = async (id) => {
  return await Product.destroy({ where: { id } });
};
