"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     */
    await queryInterface.addColumn("sales", "discount", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: "price",
    });

    await queryInterface.addColumn("sales", "shipping_cost", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: "discount",
    });

    await queryInterface.addColumn("sales", "admin_fee", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: "shipping_cost",
    });
    await queryInterface.addColumn("sales", "tax", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: "admin_fee",
    });
    await queryInterface.addColumn("sales", "payment_status", {
      type: Sequelize.ENUM("unpaid", "partial", "paid"),
      defaultValue: "unpaid",
      allowNull: false,
      after: "total",
    });

    await queryInterface.addColumn("sales", "payment_date", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "payment_status",
    });

    await queryInterface.addColumn("sales", "payment_method", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "payment_date",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     */
    await queryInterface.removeColumn("sales", "discount");
    await queryInterface.removeColumn("sales", "shipping_cost");
    await queryInterface.removeColumn("sales", "admin_fee");
    await queryInterface.removeColumn("sales", "tax");
    await queryInterface.removeColumn("sales", "payment_status");
    await queryInterface.removeColumn("sales", "payment_date");
    await queryInterface.removeColumn("sales", "payment_method");
  },
};
