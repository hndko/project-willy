"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InvoiceItem extends Model {
    static associate(models) {
      InvoiceItem.belongsTo(models.Invoice, {
        foreignKey: "invoice_id",
      });
      InvoiceItem.belongsTo(models.Product, {
        foreignKey: "product_id",
      });
    }
  }

  InvoiceItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "invoice_id",
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "product_id",
      },
      nameSnapshot: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "name_snapshot",
      },
      priceSnapshot: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "price_snapshot",
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "InvoiceItem",
      underscored: true,
    }
  );

  return InvoiceItem;
};
