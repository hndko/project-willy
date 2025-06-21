import api from "./api";

// Get all activity logs with pagination, search, and date filtering
export const getActivityLogs = async (params = {}) => {
  // Transform any Date objects to ISO strings for the API
  const apiParams = { ...params };

  // Make sure we pass the date range parameters if they exist
  if (apiParams.startDate || apiParams.endDate) {
    // No transformation needed, they're already formatted in the component
  }

  // If the limit is very large (for "view all" functionality)
  if (apiParams.limit > 200) {
    console.log(`Fetching large dataset with ${apiParams.limit} records`);
  }

  const response = await api.get("/activity-logs", { params: apiParams });
  return response.data;
};

// Get activity log by ID
export const getActivityLogById = async (id) => {
  const response = await api.get(`/activity-logs/${id}`);
  return response.data;
};

// Create new activity log
export const createActivityLog = async (logData) => {
  const response = await api.post("/activity-logs", logData);
  return response.data;
};

// Update activity log
export const updateActivityLog = async (id, logData) => {
  const response = await api.put(`/activity-logs/${id}`, logData);
  return response.data;
};

// Delete activity log
export const deleteActivityLog = async (id) => {
  const response = await api.delete(`/activity-logs/${id}`);
  return response.data;
};
