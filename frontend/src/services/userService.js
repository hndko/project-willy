import axios from "axios";

export const getUsers = async () => {
  return axios.get("/api/v1/users");
};

export const getUserById = async (id) => {
  return axios.get(`/api/v1/users/${id}`);
};

export const createUser = async (data) => {
  return axios.post("/api/v1/users", data);
};

export const updateUser = async (id, data) => {
  return axios.put(`/api/v1/users/${id}`, data);
};

export const deleteUser = async (id) => {
  return axios.delete(`/api/v1/users/${id}`);
};
