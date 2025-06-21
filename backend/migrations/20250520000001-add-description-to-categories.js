"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Categories", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "name",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Categories", "description");
  },
};
