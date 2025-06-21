import api from "./api";

// Get all raw materials with pagination and search
export const getRawMaterials = async (params = {}) => {
  const response = await api.get("/raw-materials", { params });
  return response.data;
};

// Get raw material by ID
export const getRawMaterialById = async (id) => {
  const response = await api.get(`/raw-materials/${id}`);
  return response.data;
};

// Create new raw material
export const createRawMaterial = async (materialData) => {
  const response = await api.post("/raw-materials", materialData);
  return response.data;
};

// Update raw material
export const updateRawMaterial = async (id, materialData) => {
  const response = await api.put(`/raw-materials/${id}`, materialData);
  return response.data;
};

// Delete raw material
export const deleteRawMaterial = async (id) => {
  const response = await api.delete(`/raw-materials/${id}`);
  return response.data;
};
