const asyncHandle = require("../middlewares/asyncHandle");
const { createDelivery, getAllDeliveries, getDeliveryById, getDeliveryBySaleId, updateDelivery, deleteDelivery } = require("../services/deliveryService");
const { getSaleById } = require("../services/saleService");
const { createActivityLog } = require("../services/activityLogService");

// CREATE DELIVERY
exports.createDelivery = asyncHandle(async (req, res, next) => {
  try {
    console.log("[DeliveryController] Create delivery request body:", JSON.stringify(req.body));

    // Extract fields with support for both camelCase and snake_case naming
    const saleId = req.body.saleId || req.body.sale_id;
    const userId = req.body.userId || req.body.user_id;
    const status = req.body.status || "pending";
    const shippingAddress = req.body.shippingAddress || req.body.shipping_address;
    const shippingMethod = req.body.shippingMethod || req.body.shipping_method || "";
    const courier = req.body.courier || "";
    const trackingNumber = req.body.trackingNumber || req.body.tracking_number || "";
    const scheduledDate = req.body.scheduledDate || req.body.scheduled_date || null;
    const deliveryDate = req.body.deliveryDate || req.body.delivery_date || null;
    const notes = req.body.notes || "";

    // Validate required fields
    if (!saleId) {
      return res.status(400).json({ status: "Error", message: "Sale ID is required" });
    }
    if (!userId) {
      return res.status(400).json({ status: "Error", message: "User ID is required" });
    }
    // shippingAddress tidak wajib jika auto-create dari sale
    // Validasi existing delivery hanya untuk request manual (dari frontend)
    if (!req.body._autoCreate) {
      const existingDelivery = await getDeliveryBySaleId(saleId);
      if (existingDelivery) {
        return res.status(400).json({ status: "Error", message: "Delivery already exists for this sale" });
      }
      if (!shippingAddress) {
        return res.status(400).json({ status: "Error", message: "Shipping address is required" });
      }
    }

    const deliveryData = {
      saleId,
      userId,
      status,
      shippingAddress,
      shippingMethod,
      courier,
      trackingNumber,
      scheduledDate,
      deliveryDate,
      notes,
    };

    const delivery = await createDelivery(deliveryData);
    await createActivityLog({
      userId: req.user.id,
      table: "Delivery",
      action: "Create Delivery",
      description: `Delivery created for sale: ${saleId}`,
    });
    return res.status(201).json({ status: "Success", data: delivery });
  } catch (error) {
    return res.status(500).json({ status: "Error", message: "Server error while creating delivery" });
  }
});

// GET ALL DELIVERIES with pagination & search
exports.getAllDeliveries = asyncHandle(async (req, res, next) => {
  const data = await getAllDeliveries(req.query);

  if (data.totalItems === 0) {
    return res.status(200).json({ status: "Success", message: "No deliveries found", data });
  }

  res.status(200).json({ status: "Success", data });
});

// GET DELIVERY BY ID
exports.getDeliveryDetail = asyncHandle(async (req, res, next) => {
  const delivery = await getDeliveryById(req.params.id);

  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ status: "Success", data: delivery });
});

// GET DELIVERY BY SALE ID
exports.getDeliveryBySale = asyncHandle(async (req, res, next) => {
  try {
    const { saleId } = req.params;

    console.log(`[DeliveryController] Getting delivery for sale ID: ${saleId}, type: ${typeof saleId}`);

    if (!saleId) {
      console.log("[DeliveryController] Missing sale ID in request");
      return res.status(400).json({
        status: "Error",
        message: "Sale ID is required",
      });
    }

    // First check if the sale exists
    console.log(`[DeliveryController] Checking if sale exists with ID: ${saleId}`);
    const sale = await getSaleById(saleId);

    if (!sale) {
      console.log(`[DeliveryController] Sale with ID ${saleId} not found`);
      return res.status(404).json({
        status: "Error",
        message: `Sale with ID ${saleId} not found`,
      });
    }

    console.log(`[DeliveryController] Sale found: ${sale.id}, looking for delivery`);

    const delivery = await getDeliveryBySaleId(saleId);

    if (!delivery) {
      console.log(`[DeliveryController] No delivery found for sale ID: ${saleId}`);
      // Return 404 with a clean message instead of throwing an error
      return res.status(404).json({
        status: "Error",
        message: "Delivery not found for this sale",
      });
    }

    console.log(`[DeliveryController] Delivery found for sale ID ${saleId}: ${delivery.id}`);

    return res.status(200).json({ status: "Success", data: delivery });
  } catch (error) {
    console.error(`[DeliveryController] Error in getDeliveryBySale:`, error);
    console.error(`[DeliveryController] Error stack:`, error.stack);

    // Handle unexpected errors only
    return res.status(500).json({
      status: "Error",
      message: "Server error while fetching delivery",
    });
  }
});

// UPDATE DELIVERY
exports.updateDelivery = asyncHandle(async (req, res, next) => {
  const id = req.params.id;
  const { status, shippingAddress, shippingMethod, courier, trackingNumber, scheduledDate, deliveryDate, notes } = req.body;

  // Validasi status dan courier
  const supportedCouriers = ["jne", "jnt", "shopee"];
  if (["pickup", "offline"].includes(status)) {
    // trackingNumber dan courier boleh kosong
  } else {
    if (!trackingNumber || !courier) {
      return res.status(400).json({
        status: "Error",
        message: "Tracking number dan courier wajib diisi untuk status pengiriman.",
      });
    }
    if (!supportedCouriers.includes(courier)) {
      return res.status(400).json({
        status: "Error",
        message: `Courier tidak didukung. Pilihan: ${supportedCouriers.join(", ")}`,
      });
    }
  }

  const updatedDelivery = await updateDelivery(id, {
    status,
    shippingAddress,
    shippingMethod,
    courier,
    trackingNumber,
    scheduledDate,
    deliveryDate,
    notes,
  });

  if (!updatedDelivery) {
    const error = new Error("Delivery not found or not updated");
    error.statusCode = 404;
    return next(error);
  }

  await createActivityLog({
    userId: req.user.id,
    table: "Delivery",
    action: "Update Delivery",
    description: `Delivery updated: ${updatedDelivery.id}`,
  });

  res.status(200).json({ status: "Success", data: updatedDelivery });
});

// DELETE DELIVERY
exports.deleteDelivery = asyncHandle(async (req, res, next) => {
  const id = req.params.id;

  const delivery = await getDeliveryById(id);
  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    return next(error);
  }

  await deleteDelivery(id);

  await createActivityLog({
    userId: req.user.id,
    table: "Delivery",
    action: "Delete Delivery",
    description: `Delivery deleted: ${delivery.id}`,
  });

  res.status(200).json({ status: "Success", message: `Delivery with id ${id} has been deleted` });
});
