"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Products", "cost_price", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: "price",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Products", "cost_price");
  },
};
