"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom customer_id ke tabel sales
    // dengan referensi ke tabel customers
    return queryInterface.addColumn("sales", "customer_id", {
      type: Sequelize.UUID,
      allowNull: true, // Izinkan null jika customer dihapus
      after: "user_id", // Posisi kolom (opsional)
      references: {
        model: "customers", // Tabel yang dirujuk
        key: "id",
      },
      onUpdate: "CASCADE", // Jika id customer berubah, update di sini
      onDelete: "SET NULL", // Jika customer dihapus, set kolom ini menjadi NULL
    });
  },

  async down(queryInterface, Sequelize) {
    // Menghapus kolom customer_id dari tabel sales saat undo
    return queryInterface.removeColumn("sales", "customer_id");
  },
};
