/**
 * Utility functions for handling activity log actions
 */

/**
 * Get the severity class for an action tag
 * @param {string} action - The action name
 * @returns {string} - PrimeVue severity class (success, info, danger, etc.)
 */
export const getActionSeverity = (action) => {
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return "success";
  } else if (actionLower.includes("update")) {
    return "info";
  } else if (actionLower.includes("delete")) {
    return "danger";
  }

  return "warning";
};

/**
 * Get the background and border classes for an action
 * @param {string} action - The action name
 * @returns {string} - Tailwind CSS classes for the background and border
 */
export const getActionRowClass = (action) => {
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return "bg-green-50 border-l-4 border-green-500";
  } else if (actionLower.includes("update")) {
    return "bg-blue-50 border-l-4 border-blue-500";
  } else if (actionLower.includes("delete")) {
    return "bg-red-50 border-l-4 border-red-500";
  }

  return "bg-gray-50 border-l-4 border-gray-500";
};

/**
 * Get the icon class for an action
 * @param {string} action - The action name
 * @returns {string} - PrimeVue icon class
 */
export const getActionIcon = (action) => {
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return "pi pi-plus";
  } else if (actionLower.includes("update")) {
    return "pi pi-pencil";
  } else if (actionLower.includes("delete")) {
    return "pi pi-trash";
  }

  return "pi pi-info-circle";
};

/**
 * Get the timeline icon container class for an action
 * @param {string} action - The action name
 * @returns {string} - Combined Tailwind CSS classes for the icon container
 */
export const getTimelineIconClass = (action) => {
  const baseClass = "flex items-center justify-center w-8 h-8 rounded-full text-white";
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return `${baseClass} bg-green-500`;
  } else if (actionLower.includes("update")) {
    return `${baseClass} bg-blue-500`;
  } else if (actionLower.includes("delete")) {
    return `${baseClass} bg-red-500`;
  }

  return `${baseClass} bg-gray-500`;
};
