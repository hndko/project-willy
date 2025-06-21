"use strict";

// Use Destructuring for call UUID v4
const { v4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const now = new Date();

    return queryInterface.bulkInsert(
      "Roles",
      [
        {
          id: v4(), // Fungsi uuid
          name: "admin",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "head",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "user",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "stock",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "sales",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "finance",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: v4(), // Fungsi uuid
          name: "customer",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete("Roles");
  },
};
