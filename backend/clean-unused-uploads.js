const fs = require("fs");
const path = require("path");
const { Product } = require("./models");
const { Profile } = require("./models");
const { sequelize } = require("./models");

const uploadsDir = path.join(__dirname, "public/uploads");

async function cleanUnusedUploads() {
  try {
    // 1. Ambil semua nama file gambar yang dipakai di database Product dan Profile
    await sequelize.authenticate();
    const products = await Product.findAll({ attributes: ["image"] });
    const profiles = await Profile.findAll({ attributes: ["profile_picture"] });
    const usedImages = new Set([...products.map((p) => p.image), ...profiles.map((p) => p.profile_picture)].filter(Boolean)); // filter(Boolean) untuk skip null/undefined

    // 2. Ambil semua file di folder uploads
    const files = fs.readdirSync(uploadsDir);

    // 3. Hapus file yang tidak ada di database
    let deleted = 0;
    for (const file of files) {
      if (!usedImages.has(file)) {
        fs.unlinkSync(path.join(uploadsDir, file));
        console.log("Deleted:", file);
        deleted++;
      }
    }
    console.log(`Done. ${deleted} unused files deleted.`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanUnusedUploads();
