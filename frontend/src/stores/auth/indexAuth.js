import { defineStore } from "pinia";
import {
  // state
  email,
  password,
  isLoading,
  errors,
  errorMsg,
  errorAlert,
  token,
  user,
  isAuthenticated,

  // actions
  clearErrors,
  setToken,
  clearToken,
  setUser,
  clearUser,
  resetAuthState,
  saveFormData,
  clearFormData,
} from "./state";
import { useLoginStore } from "./loginStore";
import { useLogoutStore } from "./logoutStore";
import { useRegisterStore } from "./registerStore";

/**
 * Store utama autentikasi yang mengintegrasikan semua state dan store lainnya
 */
export const useAuthStore = defineStore("auth", () => {
  // Inisialisasi store
  const loginStore = useLoginStore();
  const logoutStore = useLogoutStore();
  const registerStore = useRegisterStore();

  return {
    // State
    email,
    password,
    isLoading,
    errors,
    errorMsg,
    errorAlert,
    token,
    user,
    isAuthenticated,

    // Actions
    clearErrors,
    setToken,
    clearToken,
    setUser,
    clearUser,
    resetAuthState,
    saveFormData,
    clearFormData,

    // Login actions
    loginUser: loginStore.loginUser,
    validateLogin: loginStore.validateLogin,

    // Logout actions
    logoutUser: logoutStore.logoutUser,

    // Register actions
    registerUser: registerStore.registerUser,
  };
});
