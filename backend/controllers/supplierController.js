const asyncHandle = require("../middlewares/asyncHandle");
const { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } = require("../services/supplierService");
const { createActivityLog } = require("../services/activityLogService");

// GET ALL SUPPLIER
exports.getAllSuppliers = asyncHandle(async (req, res, next) => {
  const suppliers = await getAllSuppliers();
  res.status(200).json({ status: "Success", data: suppliers });
});

// GET SUPPLIER BY ID
exports.getSupplierDetail = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const supplier = await getSupplierById(id);

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: supplier });
});

// CREATE SUPPLIER
exports.createSupplier = asyncHandle(async (req, res, next) => {
  const { name, address, phone, email } = req.body;

  const newSupplier = await createSupplier({ name, address, phone, email });

  await createActivityLog({
    userId: req.user.id,
    table: "Supplier",
    action: "Create Supplier",
    description: `Supplier ${name} created`,
  });

  res.status(201).json({ status: "Success", data: newSupplier });
});

// UPDATE SUPPLIER
exports.updateSupplier = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const updatedSupplier = await updateSupplier(id, req.body);

  if (!updatedSupplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    return next(error);
  }

  await createActivityLog({
    userId: req.user.id,
    table: "Supplier",
    action: "Update Supplier",
    description: `Supplier ${updatedSupplier.name} updated`,
  });

  res.status(200).json({ status: "Success", data: updatedSupplier });
});

// DELETE SUPPLIER
exports.deleteSupplier = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const supplier = await getSupplierById(id);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteSupplier(id);

  await createActivityLog({
    userId: req.user.id,
    table: "Supplier",
    action: "Delete Supplier",
    description: `Supplier ${supplier.name} deleted`,
  });

  res.status(200).json({ status: "Success", message: `Supplier with id ${id} has been deleted` });
});
