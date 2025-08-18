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

export const roomApi = {
  // get all active rooms:

  getAllRooms: async () => {
    const response = await api.get("/rooms");
    return response.data;
  },

  getRoom: async (id: string) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // creatw a new room:
  createRoom: async (roomData: {
    name: string;
    description: string;
    createdBy: string;
  }) => {
    const response = await api.post("/rooms", roomData);
    return response.data;
  },

  // get rooms created by a specific user:
  getRoomsByCreator: async (userId: string) => {
    const response = await api.get(`/rooms/user/${userId}`);
    return response.data;
  },

  getMembersInRoom: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/members`);
    return response.data;
  },
};
