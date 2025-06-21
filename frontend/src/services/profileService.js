import api from "@/utils/apiInterceptor";

/**
 * Get the current user's profile
 * @returns {Promise} Promise with the response
 */
export const getProfile = async () => {
  return await api.get("/profile");
};

/**
 * Update the user's profile information
 * @param {Object} profileData - The profile data to update
 * @returns {Promise} Promise with the response
 */
export const updateProfile = async (profileData) => {
  return await api.put("/profile", profileData);
};

/**
 * Update the user's profile picture
 * @param {FormData} formData - The form data containing the profile picture
 * @returns {Promise} Promise with the response
 */
export const updateProfilePicture = async (formData) => {
  return await api.put("/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Update the user's password
 * @param {Object} passwordData - The password data (current, new, confirm)
 * @returns {Promise} Promise with the response
 */
export const updatePassword = async (passwordData) => {
  return await api.put("/profile/password", passwordData);
};
