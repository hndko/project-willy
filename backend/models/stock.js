"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Stock.belongsTo(models.Product, {
        foreignKey: "productId",
      });
      Stock.belongsTo(models.RawMaterial, {
        foreignKey: "rawMaterialId",
      });
    }
  }
  Stock.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "product_id",
      },
      rawMaterialId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "raw_material_id",
      },
      type: {
        type: DataTypes.ENUM("in", "out", "expired", "reject"),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Stock",
      tableName: "Stocks", // Untuk konsistensi
      hooks: {
        // Hooks to automatically update related models when a Stock record is created/updated
        afterCreate: async (stock, options) => {
          try {
            // Skip if called from within Product or RawMaterial hooks
            if (options.skipProductUpdate || options.skipRawMaterialUpdate) {
              return;
            }

            const { Product, RawMaterial } = sequelize.models;

            if (stock.productId) {
              const product = await Product.findByPk(stock.productId);
              if (product) {
                // Update product stock based on type
                if (stock.type === "in") {
                  product.stock += stock.stock;
                } else if (["out", "expired", "reject"].includes(stock.type)) {
                  product.stock -= stock.stock;
                }
                await product.save({ transaction: options.transaction });
              }
            }

            if (stock.rawMaterialId) {
              const rawMaterial = await RawMaterial.findByPk(stock.rawMaterialId);
              if (rawMaterial) {
                // Update raw material stock based on type
                if (stock.type === "in") {
                  rawMaterial.stock += stock.stock;
                } else if (["out", "expired", "reject"].includes(stock.type)) {
                  rawMaterial.stock -= stock.stock;
                }
                await rawMaterial.save({ transaction: options.transaction });
              }
            }
          } catch (error) {
            console.error("Error in Stock afterCreate hook:", error);
            throw error;
          }
        },
        // Similar hook for afterUpdate, but need to handle old vs new values
        afterUpdate: async (stock, options) => {
          // This is handled in the controller for more complex logic
        },
        // Clean up when a stock record is deleted
        afterDestroy: async (stock, options) => {
          try {
            const { Product, RawMaterial } = sequelize.models;

            if (stock.productId) {
              const product = await Product.findByPk(stock.productId);
              if (product) {
                // Reverse the stock change based on type
                if (stock.type === "in") {
                  product.stock -= stock.stock;
                } else if (["out", "expired", "reject"].includes(stock.type)) {
                  product.stock += stock.stock;
                }
                await product.save({ transaction: options.transaction });
              }
            }

            if (stock.rawMaterialId) {
              const rawMaterial = await RawMaterial.findByPk(stock.rawMaterialId);
              if (rawMaterial) {
                // Reverse the stock change based on type
                if (stock.type === "in") {
                  rawMaterial.stock -= stock.stock;
                } else if (["out", "expired", "reject"].includes(stock.type)) {
                  rawMaterial.stock += stock.stock;
                }
                await rawMaterial.save({ transaction: options.transaction });
              }
            }
          } catch (error) {
            console.error("Error in Stock afterDestroy hook:", error);
            throw error;
          }
        },
      },
    }
  );
  return Stock;
};
