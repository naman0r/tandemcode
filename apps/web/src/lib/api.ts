import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const userApi = {
  // create user (called when Clerk user signs up)
  createUser: async (userData: { id: string; email: string; name: string }) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },
};
