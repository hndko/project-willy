"use strict";
const { Model } = require("sequelize");
const { stockDescription } = require("../utils/stockDescription");

module.exports = (sequelize, DataTypes) => {
  class RawMaterial extends Model {
    static associate(models) {
      // Define association to Stock
      RawMaterial.hasMany(models.Stock, {
        foreignKey: "rawMaterialId",
        as: "stocks",
      });
    }
  }
  RawMaterial.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Material Name Input Must Be Filled",
          },
        },
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Material Unit Input Must Be Filled",
          },
          notEmpty: {
            msg: "Material Unit cannot be empty",
          },
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: {
            msg: "Material Stock Input Must Be Filled",
          },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: {
            msg: "Material Price Input Must Be Filled",
          },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "RawMaterial",
      tableName: "RawMaterials", // Konsistensi penamaan plural
      hooks: {
        afterValidate: (rawMaterial) => {
          if (rawMaterial.name) {
            rawMaterial.name = rawMaterial.name.toLowerCase();
          }
        },
        // Add hooks to track stock changes
        afterUpdate: async (rawMaterial, options) => {
          try {
            if (rawMaterial.changed("stock") && options.trackStock !== false) {
              const stockDiff = rawMaterial.stock - rawMaterial.previous("stock");

              if (stockDiff !== 0) {
                const { Stock } = sequelize.models;

                // Create a stock entry based on whether stock increased or decreased
                await Stock.create(
                  {
                    rawMaterialId: rawMaterial.id,
                    // If stock increased, it's an "in" type, otherwise "out"
                    type: stockDiff > 0 ? "in" : "out",
                    stock: Math.abs(stockDiff),
                    description: stockDescription({
                      action: stockDiff > 0 ? "manual_in" : "manual_out",
                      qty: Math.abs(stockDiff),
                      rawMaterial,
                      user: options.user || null,
                    }),
                  },
                  {
                    transaction: options.transaction,
                    // Prevent infinite loop
                    skipRawMaterialUpdate: true,
                  }
                );
              }
            }
          } catch (error) {
            console.error("Error in RawMaterial afterUpdate hook:", error);
            throw error;
          }
        },
      },
    }
  );
  return RawMaterial;
};
