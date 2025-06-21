import api from "./api";

// Helper function to validate parameters
const validateId = (id, operation) => {
  if (!id) {
    throw new Error(`Invalid ID provided for ${operation}. ID is required.`);
  }
  return id;
};

// Get all deliveries with pagination and search
export const getDeliveries = async (params = {}) => {
  try {
    console.log("Getting deliveries with params:", params);
    const response = await api.get("/deliveries", { params });
    return response.data;
  } catch (error) {
    console.error("Error in getDeliveries:", error.message);
    throw error;
  }
};

// Get delivery by ID
export const getDeliveryById = async (id) => {
  try {
    validateId(id, "getDeliveryById");
    console.log(`Getting delivery with ID: ${id}`);
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting delivery by ID ${id}:`, error.message);
    throw error;
  }
};

// Get delivery by sale ID
export const getDeliveryBySaleId = async (saleId) => {
  try {
    validateId(saleId, "getDeliveryBySaleId");
    console.log(`Getting delivery for sale ID: ${saleId}`);

    // Add timeout to avoid hanging requests
    const response = await api.get(`/deliveries/sale/${saleId}`, {
      timeout: 10000, // 10 second timeout
    });

    console.log(`Successfully retrieved delivery for sale ID ${saleId}:`, response.data);
    return response.data;
  } catch (error) {
    // 404 errors are expected when no delivery exists
    if (error.response && error.response.status === 404) {
      console.log(`No delivery found for sale ID: ${saleId} (404 expected)`);
      // Return null for "not found" instead of throwing an error
      return { data: null, status: "NotFound" };
    } else {
      console.error(`Error getting delivery by sale ID ${saleId}:`, error.message);
      console.error("Full error:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }
};

// Create new delivery
export const createDelivery = async (deliveryData) => {
  try {
    // Validate required fields
    if (!deliveryData) {
      throw new Error("No delivery data provided");
    }

    if (!deliveryData.sale_id) {
      throw new Error("Invalid delivery data - sale_id is required");
    }

    if (!deliveryData.user_id) {
      throw new Error("Invalid delivery data - user_id is required");
    }

    if (!deliveryData.shipping_address) {
      throw new Error("Invalid delivery data - shipping_address is required");
    }

    // Create a clean object with exactly the format the backend expects
    const cleanData = {
      saleId: deliveryData.sale_id,
      userId: deliveryData.user_id,
      status: deliveryData.status || "pending",
      shippingAddress: deliveryData.shipping_address,
      shippingMethod: deliveryData.shipping_method || "",
      courier: deliveryData.courier || "",
      trackingNumber: deliveryData.tracking_number || "",
      scheduledDate: deliveryData.scheduled_date || null,
      deliveryDate: deliveryData.delivery_date || null,
      notes: deliveryData.notes || "",
    };

    console.log("Creating new delivery with formatted data:", cleanData);

    // Set a longer timeout for this request
    const response = await api.post("/deliveries", cleanData, {
      timeout: 15000, // 15 second timeout
    });

    console.log("Create delivery response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating delivery:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);

      // Add more context to common errors
      if (error.response.status === 404) {
        console.error("Sale not found error - sale_id may be invalid");
      } else if (error.response.status === 400) {
        console.error("Bad request - validation error or delivery already exists");
      } else if (error.response.status === 500) {
        console.error("Server error - check backend logs for details");
      }
    }
    throw error;
  }
};

// Update delivery
export const updateDelivery = async (id, deliveryData) => {
  try {
    validateId(id, "updateDelivery");
    if (!deliveryData) {
      throw new Error("No delivery data provided for update");
    }

    // Map snake_case to camelCase for backend compatibility
    const cleanData = {
      status: deliveryData.status,
      shippingAddress: deliveryData.shippingAddress || deliveryData.shipping_address,
      shippingMethod: deliveryData.shippingMethod || deliveryData.shipping_method,
      courier: deliveryData.courier,
      trackingNumber: deliveryData.trackingNumber || deliveryData.tracking_number,
      scheduledDate: deliveryData.scheduledDate || deliveryData.scheduled_date,
      deliveryDate: deliveryData.deliveryDate || deliveryData.delivery_date,
      notes: deliveryData.notes,
    };

    console.log(`Updating delivery ID ${id}:`, cleanData);
    const response = await api.put(`/deliveries/${id}`, cleanData);
    console.log("Update delivery response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery ${id}:`, error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Delete delivery
export const deleteDelivery = async (id) => {
  try {
    validateId(id, "deleteDelivery");
    console.log(`Deleting delivery with ID: ${id}`);
    const response = await api.delete(`/deliveries/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting delivery ${id}:`, error.message);
    throw error;
  }
};
