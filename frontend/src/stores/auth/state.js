import { ref } from "vue";

// Helper function untuk aman mengambil data dari localStorage
const safeGetItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "undefined") return defaultValue;

    // Special handling for tokens - don't parse JWT tokens as JSON
    if (key === "token" || key === STORAGE_KEYS.TOKEN) {
      return item;
    }

    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing localStorage item '${key}':`, e);
    return defaultValue;
  }
};

// Helper function untuk aman menyimpan data ke localStorage
const safeSetItem = (key, value) => {
  try {
    // Special handling for tokens - store JWT tokens as-is
    if (key === "token" || key === STORAGE_KEYS.TOKEN) {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (e) {
    console.error(`Error setting localStorage item '${key}':`, e);
    return false;
  }
};

// Helper function untuk aman menghapus data dari localStorage
const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing localStorage item '${key}':`, e);
    return false;
  }
};

// Const keys for localStorage to avoid typos
const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  FORM_DATA: "loginFormData",
};

// Retrieve saved form data if exists
const savedFormData = safeGetItem(STORAGE_KEYS.FORM_DATA, { email: "", password: "" });

// Auth state
export const email = ref(savedFormData.email || "");
export const password = ref(savedFormData.password || "");
export const isLoading = ref(false);
export const errors = ref({ email: null, password: null, general: null });
export const errorMsg = ref(null);
export const errorAlert = ref(false);
export const token = ref(safeGetItem(STORAGE_KEYS.TOKEN) || null);
export const user = ref(safeGetItem(STORAGE_KEYS.USER));
export const isAuthenticated = ref(!!token.value);

// Save form data when changed
export const saveFormData = () => {
  const formData = {
    email: email.value,
    password: password.value,
  };
  safeSetItem(STORAGE_KEYS.FORM_DATA, formData);
};

// Clear saved form data
export const clearFormData = () => {
  safeRemoveItem(STORAGE_KEYS.FORM_DATA);
};

// Error handling
export const clearErrors = () => {
  errors.value = { email: "", password: "" };
  errorMsg.value = null;
  errorAlert.value = false;
};

// Auth token management
export const setToken = (newToken) => {
  if (!newToken) return false;

  token.value = newToken;
  safeSetItem(STORAGE_KEYS.TOKEN, newToken);
  isAuthenticated.value = true;

  return true;
};

export const clearToken = () => {
  token.value = null;
  safeRemoveItem(STORAGE_KEYS.TOKEN);
  isAuthenticated.value = false;
};

// User data management
export const setUser = (userData) => {
  if (!userData) return false;

  user.value = userData;
  safeSetItem(STORAGE_KEYS.USER, userData);

  return true;
};

export const clearUser = () => {
  user.value = null;
  safeRemoveItem(STORAGE_KEYS.USER);
};

// Full auth reset
export const resetAuthState = () => {
  clearToken();
  clearUser();
  clearErrors();
  clearFormData();
  email.value = "";
  password.value = "";
  isLoading.value = false;
};
