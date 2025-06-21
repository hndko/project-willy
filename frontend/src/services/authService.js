// src/services/authService.js
import api from "./api";

export const login = async (credentials) => {
  return await api.post("/v1/auth/login", credentials);
};
