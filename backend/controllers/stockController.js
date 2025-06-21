const asyncHandle = require("../middlewares/asyncHandle");
const { createStock, getAllStocks, getStockById, searchStocks, updateStock, deleteStock } = require("../services/stockService");
const { createActivityLog } = require("../services/activityLogService");
const { Product, RawMaterial } = require("../models");
const { sequelize } = require("../models");
const { stockDescription } = require("../utils/stockDescription");

// GET ALL STOCKS
exports.getStocks = asyncHandle(async (req, res, next) => {
  const stocks = await getAllStocks(req.query);
  res.status(200).json({ status: "Success", data: stocks });
});

// GET DETAIL STOCK
exports.getStockDetail = asyncHandle(async (req, res, next) => {
  const stock = await getStockById(req.params.id);
  if (!stock) {
    const error = new Error("Stock not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", data: stock });
});

// CREATE STOCK (IN/OUT/EXPIRED/REJECT)
exports.createStock = asyncHandle(async (req, res, next) => {
  const { productId, rawMaterialId, type, stock } = req.body;

  // Validate either productId or rawMaterialId is provided
  if (!productId && !rawMaterialId) {
    const error = new Error("Either Product ID or Raw Material ID must be provided");
    error.statusCode = 400;
    return next(error);
  }

  // Ensure stock is positive
  if (stock <= 0) {
    const error = new Error("Stock must be greater than zero");
    error.statusCode = 400;
    return next(error);
  }

  // Start a transaction to ensure data consistency
  const transaction = await sequelize.transaction();

  try {
    let product = null;
    let rawMaterial = null;

    // Check product if productId is provided
    if (productId) {
      product = await Product.findByPk(productId, { transaction });
      if (!product) {
        await transaction.rollback();
        const error = new Error("Product not found");
        error.statusCode = 404;
        return next(error);
      }
    }

    // Check raw material if rawMaterialId is provided
    if (rawMaterialId) {
      rawMaterial = await RawMaterial.findByPk(rawMaterialId, { transaction });
      if (!rawMaterial) {
        await transaction.rollback();
        const error = new Error("Raw Material not found");
        error.statusCode = 404;
        return next(error);
      }
    }

    // Create the stock record
    // The hooks in the Stock model will update the Product and RawMaterial stocks
    const newStock = await createStock(
      {
        productId,
        rawMaterialId,
        type,
        stock,
        description: stockDescription({
          action: type === "in" ? "manual_in" : "manual_out",
          qty: stock,
          product,
          rawMaterial,
          user: req.user,
        }),
      },
      transaction
    );

    // Create activity log
    await createActivityLog(
      {
        userId: req.user.id,
        table: "Stock",
        action: `Create Stock ${type}`,
        description: `Stock ${type} created with quantity ${stock} for ${product ? `product ${product.name}` : ""} ${rawMaterial ? `and material ${rawMaterial.name}` : ""}`,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({ status: "Success", data: newStock });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// SEARCH & REPORT STOCKS
exports.searchStockReport = asyncHandle(async (req, res, next) => {
  const stocks = await searchStocks(req.query);

  res.status(200).json({
    status: "Success",
    totalData: stocks.count,
    totalPages: Math.ceil(stocks.count / (req.query.limit || 10)),
    currentPage: parseInt(req.query.page) || 1,
    data: stocks.rows,
  });
});

// Update Stock
exports.updateStock = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const { type, stock } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Get the original stock record
    const stockRecord = await getStockById(id);
    if (!stockRecord) {
      await transaction.rollback();
      const error = new Error("Stock not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if the stock type or amount is being changed
    const typeChanged = type && type !== stockRecord.type;
    const stockChanged = stock && stock !== stockRecord.stock;

    // If neither type nor stock is changing, just update description
    if (!typeChanged && !stockChanged) {
      await updateStock(id, { description }, transaction);

      // Log the update
      await createActivityLog(
        {
          userId: req.user.id,
          table: "Stock",
          action: "Update Stock Description",
          description: `Stock description updated for ID ${id}`,
        },
        { transaction }
      );

      await transaction.commit();

      const updatedStock = await getStockById(id);
      return res.status(200).json({ status: "Success", data: updatedStock });
    }

    // If type or stock is changing, we need to manually update related models
    let product = null;
    let rawMaterial = null;

    // Get related product and raw material if they exist
    if (stockRecord.productId) {
      product = await Product.findByPk(stockRecord.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        const error = new Error("Related product not found");
        error.statusCode = 404;
        return next(error);
      }
    }

    if (stockRecord.rawMaterialId) {
      rawMaterial = await RawMaterial.findByPk(stockRecord.rawMaterialId, { transaction });
      if (!rawMaterial) {
        await transaction.rollback();
        const error = new Error("Related raw material not found");
        error.statusCode = 404;
        return next(error);
      }
    }

    // 1) Revert the original stock action
    if (product) {
      if (stockRecord.type === "in") {
        product.stock -= stockRecord.stock;
      } else if (["out", "expired", "reject"].includes(stockRecord.type)) {
        product.stock += stockRecord.stock;
      }
    }

    if (rawMaterial) {
      if (stockRecord.type === "in") {
        rawMaterial.stock -= stockRecord.stock;
      } else if (["out", "expired", "reject"].includes(stockRecord.type)) {
        rawMaterial.stock += stockRecord.stock;
      }
    }

    // 2) Apply the new stock action
    const newType = type || stockRecord.type;
    const newStock = stock || stockRecord.stock;

    if (product) {
      if (newType === "in") {
        product.stock += parseInt(newStock);
      } else if (["out", "expired", "reject"].includes(newType)) {
        if (product.stock < newStock) {
          await transaction.rollback();
          const error = new Error("Product stock not enough for this operation");
          error.statusCode = 400;
          return next(error);
        }
        product.stock -= parseInt(newStock);
      }
      await product.save({ transaction, trackStock: false }); // Prevent hook execution
    }

    if (rawMaterial) {
      if (newType === "in") {
        rawMaterial.stock += parseInt(newStock);
      } else if (["out", "expired", "reject"].includes(newType)) {
        if (rawMaterial.stock < newStock) {
          await transaction.rollback();
          const error = new Error("Raw material stock not enough for this operation");
          error.statusCode = 400;
          return next(error);
        }
        rawMaterial.stock -= parseInt(newStock);
      }
      await rawMaterial.save({ transaction, trackStock: false }); // Prevent hook execution
    }

    // 3) Update the stock record
    await updateStock(
      id,
      {
        type: newType,
        stock: newStock,
        description: stockDescription({
          action: newType === "in" ? "manual_in" : "manual_out",
          qty: newStock,
          product,
          rawMaterial,
          user: req.user,
        }),
      },
      transaction
    );

    // Log the activity
    await createActivityLog(
      {
        userId: req.user.id,
        table: "Stock",
        action: `Update Stock ${newType}`,
        description: `Stock updated from ${stockRecord.type}:${stockRecord.stock} to ${newType}:${newStock} for ${product ? `product ${product.name}` : ""} ${rawMaterial ? `and raw material ${rawMaterial.name}` : ""}`,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Get the updated stock record
    const updatedStock = await getStockById(id);
    res.status(200).json({ status: "Success", data: updatedStock });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// DELETE STOCK
exports.deleteStock = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Get the stock record
    const stock = await getStockById(id);
    if (!stock) {
      await transaction.rollback();
      const error = new Error("Stock not found");
      error.statusCode = 404;
      return next(error);
    }

    // The deletion will be handled by the afterDestroy hook in the Stock model
    // which will update the related Product and RawMaterial stocks
    await deleteStock(id, transaction);

    // Log the activity
    await createActivityLog(
      {
        userId: req.user.id,
        table: "Stock",
        action: "Delete Stock",
        description: stockDescription({
          action: stock.type === "in" ? "manual_in" : "manual_out",
          qty: stock.stock,
          product: stock.productId ? await Product.findByPk(stock.productId) : null,
          rawMaterial: stock.rawMaterialId ? await RawMaterial.findByPk(stock.rawMaterialId) : null,
          user: req.user,
        }),
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ status: "Success", message: `Stock with id ${id} has been deleted` });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});
