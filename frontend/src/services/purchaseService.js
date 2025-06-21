import api from "./api";

// Get all purchases with pagination and search
export const getPurchases = async (params = {}) => {
  const response = await api.get("/purchases", { params });
  return response.data;
};

// Get purchase by ID
export const getPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

// Create new purchase
export const createPurchase = async (purchaseData) => {
  const response = await api.post("/purchases", purchaseData);
  return response.data;
};

// Update purchase
export const updatePurchase = async (id, purchaseData) => {
  const response = await api.put(`/purchases/${id}`, purchaseData);
  return response.data;
};

// Delete purchase
export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data;
};
