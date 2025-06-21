const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../services/productService");
const { deleteFile } = require("../services/fileService");
const { createActivityLog } = require("../services/activityLogService");
const asyncHandle = require("../middlewares/asyncHandle");

// GET ALL PRODUCTS with pagination & search
exports.getAllProducts = asyncHandle(async (req, res, next) => {
  const data = await getAllProducts(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No product data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET PRODUCT BY ID
exports.getProductDetail = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const product = await getProductById(id);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: product });
});

// CREATE PRODUCT
exports.createProduct = asyncHandle(async (req, res, next) => {
  const { name, description, price, categoryId, supplierId, sku, stock, is_active } = req.body;

  if (!req.file) {
    const error = new Error("Image file is required");
    error.statusCode = 400;
    return next(error);
  }

  const isActiveValue = is_active === "true" || is_active === true;
  const imagePath = req.file.filename;

  const newProduct = await createProduct({
    name,
    description,
    price,
    categoryId,
    supplierId,
    sku,
    stock,
    is_active: isActiveValue,
    image: imagePath,
  });

  await createActivityLog({
    userId: req.user.id,
    action: "Create Product",
    description: `Product ${newProduct.name} created.`,
    table: "Product",
  });

  res.status(201).json({ status: "Success", data: newProduct });
});

// UPDATE PRODUCT
exports.updateProduct = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const product = await getProductById(id);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    return next(error);
  }

  if (req.file) {
    deleteFile(product.image);
    req.body.image = req.file.filename;
  }

  const updatedProduct = await updateProduct(id, req.body);

  await createActivityLog({
    userId: req.user.id,
    action: "Update Product",
    description: `Product ${updatedProduct.name} updated.`,
    table: "Product",
  });

  res.status(200).json({ status: "Success", data: updatedProduct });
});

// DELETE PRODUCT
exports.deleteProduct = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const product = await getProductById(id);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    return next(error);
  }

  deleteFile(product.image);
  await deleteProduct(id);

  await createActivityLog({
    userId: req.user.id,
    action: "Delete Product",
    description: `Product ${product.name} deleted.`,
    table: "Product",
  });

  res.status(200).json({ status: "Success", message: `Product with id ${id} has been deleted` });
});
