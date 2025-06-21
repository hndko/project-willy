const asyncHandle = require("../middlewares/asyncHandle");
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require("../services/categoryService");
const { createActivityLog } = require("../services/activityLogService");

// GET ALL CATEGORY
exports.getAllCategories = asyncHandle(async (req, res, next) => {
  const categories = await getAllCategories();
  res.status(200).json({ status: "Success", data: categories });
});

// GET CATEGORY BY ID
exports.getCategoryDetail = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const category = await getCategoryById(id);

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: category });
});

// CREATE CATEGORY
exports.createCategory = asyncHandle(async (req, res, next) => {
  const { name, description } = req.body;

  const newCategory = await createCategory({ name, description });

  await createActivityLog({
    userId: req.user.id,
    table: "Category",
    action: "Create Category",
    description: `Category ${name} created`,
  });

  res.status(201).json({ status: "Success", data: newCategory });
});

// UPDATE CATEGORY
exports.updateCategory = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const updatedCategory = await updateCategory(id, req.body);

  if (!updatedCategory) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    return next(error);
  }

  await createActivityLog({
    userId: req.user.id,
    table: "Category",
    action: "Update Category",
    description: `Category ${updatedCategory.name} updated`,
  });

  res.status(200).json({ status: "Success", data: updatedCategory });
});

// DELETE CATEGORY
exports.deleteCategory = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const category = await getCategoryById(id);
  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteCategory(id);

  await createActivityLog({
    userId: req.user.id,
    table: "Category",
    action: "Delete Category",
    description: `Category ${category.name} deleted`,
  });

  res.status(200).json({ status: "Success", message: `Category with id ${id} has been deleted` });
});
