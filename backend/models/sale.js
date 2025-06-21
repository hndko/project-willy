"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sale.belongsTo(models.Product, { foreignKey: "product_id" });
      Sale.belongsTo(models.User, { foreignKey: "user_id" });
      Sale.belongsTo(models.Customer, {
        foreignKey: "customer_id",
      });
      Sale.hasOne(models.Delivery, { foreignKey: "sale_id" });
      Sale.hasMany(models.Invoice, { foreignKey: "sale_id" });
    }
  }
  Sale.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "product_id",
        validate: {
          notNull: {
            msg: "Please select a product",
          },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "customer_id",
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      discount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      shippingCost: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: "shipping_cost",
      },
      adminFee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: "admin_fee",
      },
      tax: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM("unpaid", "partial", "paid"),
        defaultValue: "unpaid",
        allowNull: false,
        field: "payment_status",
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "payment_date",
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "payment_method",
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please select sale date",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Sale",
      tableName: "sales",
      underscored: true,
    }
  );
  return Sale;
};
