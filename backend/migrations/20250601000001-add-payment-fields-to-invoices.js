"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("invoices", "payment_status", {
      type: Sequelize.ENUM("unpaid", "partial", "paid"),
      defaultValue: "unpaid",
      allowNull: false,
    });

    await queryInterface.addColumn("invoices", "payment_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("invoices", "payment_method", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("invoices", "payment_status");
    await queryInterface.removeColumn("invoices", "payment_date");
    await queryInterface.removeColumn("invoices", "payment_method");
  },
};
