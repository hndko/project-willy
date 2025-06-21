"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Supplier.hasMany(models.Product, {
        foreignKey: "supplier_id",
      });
    }
  }
  Supplier.init(
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
          msg: "Supplier Name Already Exists, please enter another product name",
        },
        validate: {
          notNull: {
            msg: "Supplier Name Input Must Be Filled",
          },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please input your address.",
          },
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please input your phone.",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notNull: {
            msg: "Please input your email.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Supplier",
      hooks: {
        afterValidate: (supplier) => {
          if (supplier.name) {
            supplier.name = supplier.name.toLowerCase();
          }
        },
      },
    }
  );
  return Supplier;
};
