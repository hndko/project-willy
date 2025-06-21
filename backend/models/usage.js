"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Usage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Usage.belongsTo(models.RawMaterial, {
        foreignKey: "rawMaterialId",
      });
      Usage.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  Usage.init(
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
          notNull: {
            msg: "Please select the raw material usage",
          },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          notNull: {
            msg: "Please fill in the amount of raw material usage",
          },
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please enter the date of use of raw materials",
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
      modelName: "Usage",
      underscored: true,
      hooks: {
        afterCreate: async (usage, options) => {
          // Kurangi stock raw material setelah usage dibuat
          const { RawMaterial } = sequelize.models;
          const material = await RawMaterial.findByPk(usage.rawMaterialId);
          if (material) {
            material.stock -= usage.qty;
            await material.save({ transaction: options.transaction });
          }
        },
        afterDestroy: async (usage, options) => {
          // Tambah kembali stock raw material jika usage dihapus
          const { RawMaterial } = sequelize.models;
          const material = await RawMaterial.findByPk(usage.rawMaterialId);
          if (material) {
            material.stock += usage.qty;
            await material.save({ transaction: options.transaction });
          }
        },
      },
    }
  );
  return Usage;
};
