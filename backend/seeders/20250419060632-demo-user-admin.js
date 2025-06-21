"use strict";
const { v4 } = require("uuid");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const salt = await bcrypt.genSaltSync(9); // Membuat password enkripsi
    // Jadi kita select id didalam table rolesnya, dimana namenya = admin.
    const adminId = await queryInterface.rawSelect(
      "roles",
      {
        where: { name: "admin" },
      },
      ["id"] // kita bisa mengambil id dari tables rolesnya.
    ); // Ambil id dari adminnya.

    Example: await queryInterface.bulkInsert(
      "users", // Kita ambil sesuai dengan nama di dalam colum databasenya
      [
        {
          id: v4(), // Ambil id dari uuid v4
          username: "noticescent",
          name: "admin notice scent",
          email: "notice@mail.com",
          phone: "081234347676",
          password: bcrypt.hashSync("12345678", salt),
          role_id: adminId,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users");
  },
};
