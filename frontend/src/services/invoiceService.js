import api from "./api";

// Get all invoices with pagination and search
export const getInvoices = async (params = {}) => {
  console.log("getInvoices called with params:", params);
  const response = await api.get("/invoices", { params });
  console.log("API response for invoices:", response.data);

  // Ensure we're returning the data in the expected format
  if (response.data && response.data.status === "Success") {
    return {
      data: response.data.data || [],
      totalData: response.data.totalData || 0,
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1,
    };
  }

  // Fallback for unexpected response format
  console.error("Unexpected response format:", response.data);
  return {
    data: [],
    totalData: 0,
    totalPages: 1,
    currentPage: 1,
  };
};

// Get invoice by ID
export const getInvoiceById = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

// Create new invoice
export const createInvoice = async (invoiceData) => {
  const response = await api.post("/invoices", invoiceData);
  return response.data;
};

// Update invoice
export const updateInvoice = async (id, invoiceData) => {
  const response = await api.put(`/invoices/${id}`, invoiceData);
  return response.data;
};

// Delete invoice
export const deleteInvoice = async (id) => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

// Update invoice payment status
export const updateInvoicePayment = async (id, paymentData) => {
  const response = await api.patch(`/invoices/${id}/payment`, paymentData);
  return response.data;
};

// Generate invoice PDF
export const generateInvoicePDF = async (id) => {
  const response = await api.get(`/invoices/pdf/${id}`);
  return response.data;
};
