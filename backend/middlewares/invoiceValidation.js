const Joi = require("joi");

exports.createInvoiceSchema = Joi.object({
  saleId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
  customerId: Joi.string().uuid().optional().allow(null, ""),
  date: Joi.date().required(),
  tax: Joi.number().optional(),
  discount: Joi.number().optional(),
  total: Joi.number().required(),
  shippingCost: Joi.number().optional(),
  adminFee: Joi.number().optional(),
  paymentStatus: Joi.string().valid("unpaid", "partial", "paid").default("unpaid"),
  paymentDate: Joi.date().allow(null),
  paymentMethod: Joi.string().allow(null, ""),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        nameSnapshot: Joi.string().required(),
        priceSnapshot: Joi.number().required(),
        qty: Joi.number().required(),
        subtotal: Joi.number().required(),
        shippingCost: Joi.number().optional(),
        adminFee: Joi.number().optional(),
        tax: Joi.number().optional(),
        discount: Joi.number().optional(),
      })
    )
    .min(1)
    .required(),
});

// Add validation for payment update
exports.updatePaymentSchema = Joi.object({
  paymentStatus: Joi.string().valid("unpaid", "partial", "paid").required(),
  paymentDate: Joi.date().allow(null),
  paymentMethod: Joi.string().allow(null, ""),
});
