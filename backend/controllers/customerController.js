const asyncHandle = require("../middlewares/asyncHandle");
const { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require("../services/customerService");
const { createActivityLog } = require("../services/activityLogService");

exports.getCustomers = asyncHandle(async (req, res, next) => {
  const data = await getAllCustomers(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No customer data found", data });
  }

  res.status(200).json({ status: "Success", data });
});

exports.getCustomerDetail = asyncHandle(async (req, res, next) => {
  const customer = await getCustomerById(req.params.id);
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    return next(error);
  }
  res.status(200).json({ status: "Success", data: customer });
});

exports.createCustomer = asyncHandle(async (req, res, next) => {
  const customer = await createCustomer(req.body);
  await createActivityLog({
    userId: req.user.id,
    action: "Create Customer",
    description: `Customer ${customer.name} created`,
    table: "Customer",
  });
  res.status(201).json({ status: "Success", data: customer });
});

exports.updateCustomer = asyncHandle(async (req, res, next) => {
  const updated = await updateCustomer(req.params.id, req.body);
  await createActivityLog({
    userId: req.user.id,
    action: "Update Customer",
    description: `Customer ${updated.name} updated`,
    table: "Customer",
  });
  res.status(200).json({ status: "Success", data: updated });
});

exports.deleteCustomer = asyncHandle(async (req, res, next) => {
  const customer = await getCustomerById(req.params.id);
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    return next(error);
  }
  await deleteCustomer(req.params.id);
  await createActivityLog({
    userId: req.user.id,
    action: "Delete Customer",
    description: `Customer ${customer.name} deleted`,
    table: "Customer",
  });
  res.status(200).json({ status: "Success", message: `Customer deleted` });
});
