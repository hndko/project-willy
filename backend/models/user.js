"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: "role_id" });

      // User has one Profile (one-to-one)
      User.hasOne(models.Profile, {
        foreignKey: "user_id",
        as: "profile",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      role_id: {
        type: DataTypes.UUID,
        field: "role_id",
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          len: [4, 25],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6],
          notNull: {
            msg: "Password harus di isi dan minimal 6 karakter",
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [10],
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login",
      },
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(9);
            user.password = await bcrypt.hash(user.password, salt);
          }
          if (!user.role_id) {
            const roleUser = await sequelize.models.Role.findOne({ where: { name: "user" } });
            user.role_id = roleUser?.id;
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSaltSync(9);
            user.password = await bcrypt.hashSync(user.password, salt);
          }
        },
        afterCreate: async (user) => {
          // Create a profile record for the new user
          await sequelize.models.Profile.create({
            user_id: user.id,
            full_name: user.name || "",
            email: user.email,
            phone_number: user.phone || "",
          });
        },
      },
      sequelize,
      modelName: "User",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  User.prototype.correctPassword = async function (reqPassword) {
    console.log("Comparing passwords:");
    console.log("- Requested password length:", reqPassword.length);
    console.log("- Stored hashed password length:", this.password.length);

    try {
      const result = await bcrypt.compare(reqPassword, this.password);
      console.log("- Password comparison result:", result);
      return result;
    } catch (error) {
      console.error("Password comparison error:", error);
      return false;
    }
  };

  return User;
};
