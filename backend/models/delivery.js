"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Delivery extends Model {
    static associate(models) {
      // One sale can have one delivery
      Delivery.belongsTo(models.Sale, { foreignKey: "sale_id" });
      // Track who created/updated the delivery
      Delivery.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  Delivery.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      saleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "sale_id",
        validate: {
          notNull: {
            msg: "Sale reference is required",
          },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      status: {
        type: DataTypes.ENUM("pending", "processing", "shipped", "delivered", "cancelled", "pickup", "offline"),
        allowNull: false,
        defaultValue: "pending",
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "shipping_address",
      },
      shippingMethod: {
        type: DataTypes.STRING,
        field: "shipping_method",
      },
      courier: {
        type: DataTypes.STRING,
      },
      trackingNumber: {
        type: DataTypes.STRING,
        field: "tracking_number",
      },
      scheduledDate: {
        type: DataTypes.DATE,
        field: "scheduled_date",
      },
      deliveryDate: {
        type: DataTypes.DATE,
        field: "delivery_date",
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "Delivery",
      tableName: "deliveries",
      underscored: true,
    }
  );
  return Delivery;
};
