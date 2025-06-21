/**
 * Format a date string into a more readable format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get the severity class for a stock type
 * @param {string} type - The stock type ('in', 'out', 'expired', 'reject')
 * @returns {string} - The severity class for styling
 */
export const getTypeSeverity = (type) => {
  switch (type) {
    case "in":
      return "success";
    case "out":
      return "info";
    case "expired":
      return "warning";
    case "reject":
      return "danger";
    default:
      return null;
  }
};

/**
 * Get label for each stock type
 * @param {string} type - The stock type
 * @returns {string} - The human-readable label
 */
export const getTypeLabel = (type) => {
  switch (type) {
    case "in":
      return "Stock In";
    case "out":
      return "Stock Out";
    case "expired":
      return "Expired";
    case "reject":
      return "Rejected";
    default:
      return type;
  }
};

/**
 * Create a default filter object for stock queries
 * @param {string} entityType - The entity type ('product' or 'material')
 * @returns {Object} - Default filter object
 */
export const createDefaultFilter = (entityType = null) => {
  return {
    search: "",
    type: null,
    page: 1,
    limit: 10,
    ...(entityType ? { entityType } : {}),
  };
};
