"use strict";
const { v4 } = require("uuid");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const salt = bcrypt.genSaltSync(10);

    // Mengambil ID dari role "admin"
    const adminId = await queryInterface.rawSelect(
      "roles",
      { where: { name: "admin" } },
      ["id"]
    );

    // Jika role admin tidak ditemukan, hentikan seeder
    if (!adminId) {
      console.log("Admin role not found, skipping admin user seed.");
      return;
    }

    // Memasukkan data admin dengan SEMUA kolom yang dibutuhkan
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          id: v4(),
          username: "noticescent", // WAJIB ADA: Mengisi kolom username
          name: "Admin Notice Scent",
          email: "notice@mail.com",
          phone: "081234567890", // WAJIB ADA: Mengisi kolom phone
          password: bcrypt.hashSync("12345678", salt),
          role_id: adminId,
          last_login: now, // Diisi null karena user baru belum pernah login
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Menghapus hanya user yang dibuat oleh seeder ini
    await queryInterface.bulkDelete("Users", { email: "notice@mail.com" });
  },
};
