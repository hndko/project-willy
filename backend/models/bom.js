"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BoM extends Model {
    static associate(models) {
      BoM.belongsTo(models.Product, { foreignKey: "product_id" });
      BoM.belongsTo(models.RawMaterial, { foreignKey: "raw_material_id" });
    }
  }
  BoM.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      raw_material_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      qty: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0.0001,
          notNull: { msg: "Qty must be filled" },
        },
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "BoM",
      tableName: "BoMs",
    }
  );
  return BoM;
};
