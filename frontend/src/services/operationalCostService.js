import api from "./api";

// Get all operational costs with pagination and search
export const getOperationalCosts = async (params = {}) => {
  const response = await api.get("/operationals-cost", { params });
  return response.data;
};

// Get operational cost by ID
export const getOperationalCostById = async (id) => {
  const response = await api.get(`/operationals-cost/${id}`);
  return response.data;
};

// Create new operational cost
export const createOperationalCost = async (costData) => {
  const response = await api.post("/operationals-cost", costData);
  return response.data;
};

// Update operational cost
export const updateOperationalCost = async (id, costData) => {
  const response = await api.put(`/operationals-cost/${id}`, costData);
  return response.data;
};

// Delete operational cost
export const deleteOperationalCost = async (id) => {
  const response = await api.delete(`/operationals-cost/${id}`);
  return response.data;
};
