import api from "./api";

// Get all stocks with pagination and search
export const getStocks = async (params = {}) => {
  // If entityType is specified, add appropriate filtering
  const queryParams = { ...params };

  // If we're filtering by entity type, adjust the query
  if (queryParams.entityType) {
    // Add logic to filter by entity type
    if (queryParams.entityType === "product") {
      queryParams.hasProduct = true;
    } else if (queryParams.entityType === "material") {
      queryParams.hasMaterial = true;
    }

    // Remove the entityType since backend doesn't need it directly
    delete queryParams.entityType;
  }

  const response = await api.get("/stocks", { params: queryParams });
  return response.data;
};

// Create new stock
export const createStock = async (stockData) => {
  const response = await api.post("/stocks", stockData);
  return response.data;
};

// Get stock by ID
export const getStockById = async (id) => {
  const response = await api.get(`/stocks/${id}`);
  return response.data;
};

// Update stock
export const updateStock = async (id, stockData) => {
  const response = await api.put(`/stocks/${id}`, stockData);
  return response.data;
};

// Delete stock
export const deleteStock = async (id) => {
  const response = await api.delete(`/stocks/${id}`);
  return response.data;
};

// Search stock reports
export const searchStockReport = async (params = {}) => {
  const response = await api.get("/stocks/report", { params });
  return response.data;
};
