const { BoM, Product, RawMaterial } = require("../models");

// Get all BoMs (optionally by product)
exports.getAllBoMs = async (filter = {}) => {
  return await BoM.findAll({
    where: filter,
    include: [
      { model: Product, attributes: ["id", "name"] },
      { model: RawMaterial, attributes: ["id", "name", "unit"] },
    ],
  });
};

// Get BoM by ID
exports.getBoMById = async (id) => {
  return await BoM.findByPk(id, {
    include: [
      { model: Product, attributes: ["id", "name"] },
      { model: RawMaterial, attributes: ["id", "name", "unit"] },
    ],
  });
};

// Create BoM
exports.createBoM = async (data) => {
  return await BoM.create(data);
};

// Update BoM
exports.updateBoM = async (id, data) => {
  const bom = await BoM.findByPk(id);
  if (!bom) return null;
  await bom.update(data);
  return bom;
};

// Delete BoM
exports.deleteBoM = async (id) => {
  const bom = await BoM.findByPk(id);
  if (!bom) return null;
  await bom.destroy();
  return true;
};

// Get BoM for a product (all raw materials needed)
exports.getBoMByProduct = async (product_id) => {
  try {
    const boms = await BoM.findAll({
      where: { product_id },
      include: [{ model: RawMaterial, attributes: ["id", "name", "unit"] }],
      raw: false,
    });
    return boms;
  } catch (err) {
    console.error("Error fetching BoM by product:", err);
    throw err;
  }
};
