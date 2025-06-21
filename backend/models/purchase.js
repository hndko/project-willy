"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Purchase.belongsTo(models.RawMaterial, {
        foreignKey: "raw_material_id",
      });
      Purchase.belongsTo(models.Supplier, {
        foreignKey: "supplier_id",
      });
      Purchase.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  Purchase.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      rawMaterialId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "raw_material_id",
        validate: {
          notNull: { msg: "Raw Material ID is required" },
        },
      },
      supplierId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "supplier_id",
        validate: {
          notNull: { msg: "Supplier ID is required" },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        validate: {
          notNull: { msg: "User ID is required" },
        },
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          notNull: { msg: "Quantity is required" },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          notNull: { msg: "Price is required" },
        },
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          notNull: { msg: "Total is required" },
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          notNull: { msg: "Date is required" },
        },
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "canceled"),
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: {
            args: [["pending", "completed", "canceled"]],
            msg: "Status must be pending, completed, or canceled",
          },
        },
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: "invoice_number",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "received_date",
      },
    },
    {
      sequelize,
      modelName: "Purchase",
      underscored: true,
    }
  );
  return Purchase;
};
