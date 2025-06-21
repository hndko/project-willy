import axios from "axios";

export const getRoles = async () => {
  return axios.get("/api/v1/roles");
};
