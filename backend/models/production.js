"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Production extends Model {
    static associate(models) {
      Production.belongsTo(models.Product, { foreignKey: "product_id" });
      Production.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  Production.init(
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          notNull: { msg: "Qty must be filled" },
        },
      },
      production_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("planned", "in_progress", "done", "canceled"),
        allowNull: false,
        defaultValue: "planned",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hpp: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Production",
      tableName: "Productions",
      underscored: true,
    }
  );
  return Production;
};
