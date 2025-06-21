import api from "./api";

export const getBoMs = async (params = {}) => api.get("/boms", { params });
export const getBoMById = async (id) => api.get(`/boms/${id}`);
export const getBoMByProduct = async (product_id) => api.get(`/boms/product/${product_id}`);
export const createBoM = async (data) => api.post("/boms", data);
export const updateBoM = async (id, data) => api.put(`/boms/${id}`, data);
export const deleteBoM = async (id) => api.delete(`/boms/${id}`);
export const getBoMsGroupedByProduct = async () => api.get("/boms/group-by-product");
