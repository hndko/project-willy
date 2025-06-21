"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // 1 category punya banyak product
      Category.hasMany(models.Product, {
        foreignKey: "category_id",
      });
    }
  }

  Category.init(
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
          msg: "Category Name not Available, please input new name category",
        },
        validate: {
          notNull: {
            msg: "Category Name cannot be empty",
          },
          notEmpty: {
            msg: "Category Name cannot be empty",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Category",
      hooks: {
        afterValidate: (category) => {
          if (category.name) {
            category.name = category.name.toLowerCase();
          }
        },
      },
    }
  );

  return Category;
};
