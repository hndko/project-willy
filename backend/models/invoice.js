"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      // Assosiasi
      Invoice.belongsTo(models.User, { foreignKey: "user_id" });
      Invoice.belongsTo(models.Customer, { foreignKey: "customer_id" });
      Invoice.belongsTo(models.Sale, { foreignKey: "sale_id" });
      Invoice.hasMany(models.InvoiceItem, { foreignKey: "invoice_id" });
    }
  }

  Invoice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "invoice_number",
      },
      saleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "sale_id",
        validate: {
          notNull: {
            msg: "Select Sale",
          },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        validate: {
          notNull: {
            msg: "Select User",
          },
        },
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "customer_id",
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please Select Date",
          },
        },
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      tax: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      discount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM("unpaid", "partial", "paid"),
        allowNull: false,
        defaultValue: "unpaid",
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
    },
    {
      sequelize,
      modelName: "Invoice",
      underscored: true,
    }
  );

  return Invoice;
};
