import api from "./api";

// Get all sales with pagination and search
export const getSales = async (params = {}) => {
  try {
    // Filter out any undefined or null values from params
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""));

    console.log("Requesting sales with clean params:", cleanParams);

    // Make the API request - handle any errors in the component
    const response = await api.get("/sales", { params: cleanParams });
    return response.data;
  } catch (error) {
    console.error("Error in getSales service:", error);
    // Rethrow to allow component to handle it
    throw error;
  }
};

// Get sale by ID
export const getSaleById = async (id) => {
  try {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale ${id}:`, error);
    throw error;
  }
};

// Create new sale
export const createSale = async (saleData) => {
  try {
    const response = await api.post("/sales", saleData);
    return response.data;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
};

// Update sale
export const updateSale = async (id, saleData) => {
  try {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating sale ${id}:`, error);
    throw error;
  }
};

// Delete sale
export const deleteSale = async (id) => {
  try {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting sale ${id}:`, error);
    throw error;
  }
};
