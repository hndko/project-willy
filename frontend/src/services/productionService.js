import api from "./api";

export const getProductions = async (params = {}) => {
  const response = await api.get("/productions", { params });
  return response.data;
};
export const getProductionById = async (id) => api.get(`/productions/${id}`);
export const createProduction = async (data) => api.post("/productions", data);
export const updateProduction = async (id, data) => api.put(`/productions/${id}`, data);
export const deleteProduction = async (id) => api.delete(`/productions/${id}`);
export const processProduction = async (id) => api.post(`/productions/${id}/process`);
export const getProductionHppBreakdown = async (id) => api.get(`/productions/${id}/hpp-breakdown`);
