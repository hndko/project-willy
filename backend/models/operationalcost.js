"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OperationalCost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OperationalCost.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  OperationalCost.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please enter the operational cost title",
          },
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please write down the operational cost requirements",
          },
        },
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          notNull: {
            msg: "Please fill in the operational cost budget",
          },
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please select the date of operational cost requirements",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "OperationalCost",
      underscored: true,
    }
  );
  return OperationalCost;
};
