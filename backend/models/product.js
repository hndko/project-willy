"use strict";
const { Model } = require("sequelize");
const { stockDescription } = require("../utils/stockDescription");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: "category_id",
      });
      Product.belongsTo(models.Supplier, {
        foreignKey: "supplier_id",
      });
      Product.hasMany(models.Stock, {
        foreignKey: "productId",
        as: "stocks",
      });
      Product.hasMany(models.BoM, { foreignKey: "product_id" });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Product Name Already Exists, please enter another product name",
        },
        validate: {
          notNull: { msg: "Product Name Input Must Be Filled" },
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: "Price Input Must Be Filled!" },
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Input Image Product" },
        },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "category_id", // Mapping ke DB
        validate: {
          notNull: { msg: "Input Product Category ID Must Be Filled!" },
        },
      },
      supplierId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "supplier_id", // Mapping ke DB
        validate: {
          notNull: { msg: "Input Product Supplier ID Must Be Filled!" },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      cost_price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "Products", // optional untuk memastikan table name plural
      hooks: {
        afterValidate: (product) => {
          if (product.name) {
            product.name = product.name.toLowerCase();
          }
        },
        // Add hooks to track stock changes
        afterUpdate: async (product, options) => {
          try {
            if (product.changed("stock") && options.trackStock !== false) {
              const stockDiff = product.stock - product.previous("stock");

              if (stockDiff !== 0) {
                const { Stock } = sequelize.models;

                await Stock.create(
                  {
                    productId: product.id,
                    type: stockDiff > 0 ? "in" : "out",
                    stock: Math.abs(stockDiff),
                    description: stockDescription({
                      action: stockDiff > 0 ? "manual_in" : "manual_out",
                      qty: Math.abs(stockDiff),
                      product,
                      user: options.user || null,
                    }),
                  },
                  {
                    transaction: options.transaction,
                    skipProductUpdate: true,
                  }
                );
              }
            }
          } catch (error) {
            console.error("Error in Product afterUpdate hook:", error);
            throw error;
          }
        },
      },
    }
  );

  return Product;
};
