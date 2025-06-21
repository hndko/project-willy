"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("deliveries", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sales",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM("pending", "processing", "shipped", "delivered", "cancelled", "pickup", "offline"),
        allowNull: false,
        defaultValue: "pending",
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      shipping_method: {
        type: Sequelize.STRING,
      },
      courier: {
        type: Sequelize.STRING,
      },
      tracking_number: {
        type: Sequelize.STRING,
      },
      scheduled_date: {
        type: Sequelize.DATE,
      },
      delivery_date: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("deliveries");
  },
};
