const asyncHandle = require("../middlewares/asyncHandle");
const { createRawMaterial, getAllRawMaterials, getRawMaterialById, updateRawMaterial, deleteRawMaterial } = require("../services/rawMaterialService");
const { createActivityLog } = require("../services/activityLogService");

// CREATE
exports.createRawMaterial = asyncHandle(async (req, res, next) => {
  const { name, unit, price, stock } = req.body;

  const material = await createRawMaterial({ name, unit, price, stock });

  await createActivityLog({
    userId: req.user.id,
    action: "Create Raw Material",
    description: `Created raw material ${material.name}`,
    table: "RawMaterial",
  });

  res.status(201).json({ status: "Success", data: material });
});

// READ ALL with search & pagination
exports.getAllRawMaterials = asyncHandle(async (req, res, next) => {
  const data = await getAllRawMaterials(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No raw material data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// READ DETAIL
exports.getRawMaterialDetail = asyncHandle(async (req, res, next) => {
  const material = await getRawMaterialById(req.params.id);

  if (!material) {
    const error = new Error("Raw Material not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: material });
});

// UPDATE
exports.updateRawMaterial = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  await updateRawMaterial(id, req.body);

  const updatedMaterial = await getRawMaterialById(id);

  await createActivityLog({
    userId: req.user.id,
    action: "Update Raw Material",
    description: `Updated raw material ${updatedMaterial.name}`,
    table: "RawMaterial",
  });

  res.status(200).json({ status: "Success", data: updatedMaterial });
});

// DELETE
exports.deleteRawMaterial = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const material = await getRawMaterialById(id);

  if (!material) {
    const error = new Error("Raw Material not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteRawMaterial(id);

  await createActivityLog({
    userId: req.user.id,
    action: "Delete Raw Material",
    description: `Deleted raw material ${material.name}`,
    table: "RawMaterial",
  });

  res.status(200).json({ status: "Success", message: `Raw Material with id ${id} deleted` });
});
