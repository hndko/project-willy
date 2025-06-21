"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate(models) {
      // Profile belongs to User (one-to-one)
      Profile.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  Profile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [10, 15],
        },
      },
      profile_picture: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_complete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_complete",
      },
    },
    {
      sequelize,
      modelName: "Profile",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Profile;
};
