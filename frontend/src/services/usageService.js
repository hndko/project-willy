import api from "./api";

// Get all usages with pagination and search
export const getUsages = async (params = {}) => {
  const response = await api.get("/usages", { params });
  return response.data;
};

// Get usage by ID
export const getUsageById = async (id) => {
  const response = await api.get(`/usages/${id}`);
  return response.data;
};

// Create new usage
export const createUsage = async (usageData) => {
  const response = await api.post("/usages", usageData);
  return response.data;
};

// Update usage
export const updateUsage = async (id, usageData) => {
  const response = await api.put(`/usages/${id}`, usageData);
  return response.data;
};

// Delete usage
export const deleteUsage = async (id) => {
  const response = await api.delete(`/usages/${id}`);
  return response.data;
};
