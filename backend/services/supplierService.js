const { Supplier, Product } = require("../models");

// Get all suppliers
exports.getAllSuppliers = async () => {
  return await Supplier.findAll();
};

// Get supplier by ID
exports.getSupplierById = async (id) => {
  return await Supplier.findByPk(id, {
    include: [{ model: Product, attributes: { exclude: ["supplierId"] } }],
  });
};

// Create new supplier
exports.createSupplier = async (supplierData) => {
  return await Supplier.create(supplierData);
};

// Update supplier
exports.updateSupplier = async (id, supplierData) => {
  await Supplier.update(supplierData, { where: { id } });
  return await Supplier.findByPk(id);
};

// Delete supplier
exports.deleteSupplier = async (id) => {
  return await Supplier.destroy({ where: { id } });
};
