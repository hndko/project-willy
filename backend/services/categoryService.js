const { Category, Product } = require("../models");

// Get all categories
exports.getAllCategories = async () => {
  return await Category.findAll();
};

// Get category by ID
exports.getCategoryById = async (id) => {
  return await Category.findByPk(id, {
    include: [{ model: Product, attributes: { exclude: ["categoryId"] } }],
  });
};

// Create new category
exports.createCategory = async (categoryData) => {
  return await Category.create(categoryData);
};

// Update category
exports.updateCategory = async (id, categoryData) => {
  await Category.update(categoryData, { where: { id } });
  return await Category.findByPk(id);
};

// Delete category
exports.deleteCategory = async (id) => {
  return await Category.destroy({ where: { id } });
};
