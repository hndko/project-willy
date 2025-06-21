import api from "./api";

// Get all products with pagination and search
export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

// Get product by ID
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Create new product
export const createProduct = async (productData) => {
  // Using FormData for file uploads
  const formData = new FormData();

  Object.keys(productData).forEach((key) => {
    if (key === "image" && productData[key] instanceof File) {
      formData.append(key, productData[key]);
    } else {
      formData.append(key, productData[key]);
    }
  });

  const response = await api.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Update product
export const updateProduct = async (id, productData) => {
  // Using FormData for file uploads
  const formData = new FormData();

  Object.keys(productData).forEach((key) => {
    if (key === "image" && productData[key] instanceof File) {
      formData.append(key, productData[key]);
    } else {
      formData.append(key, productData[key]);
    }
  });

  const response = await api.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Delete product
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
