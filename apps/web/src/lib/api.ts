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

  setRoomProblem: async (roomId: string, problemId: string) => {
    const response = await api.patch(`/rooms/${roomId}/problem`, { problemId });
    return response.data;
  },
};

export const problemApi = {
  getAllProblems: async (difficulty?: string) => {
    const params = difficulty ? { difficulty } : {};
    const response = await api.get("/problems", { params });
    return response.data;
  },

  getProblem: async (id: string) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  getProblemBySlug: async (slug: string) => {
    const response = await api.get(`/problems/slug/${slug}`);
    return response.data;
  },
};

export const submissionApi = {
  submit: async (data: {
    roomId: string;
    userId: string;
    problemId: string;
    language: string;
    code: string;
  }) => {
    const response = await api.post("/submissions", data);
    return response.data;
  },

  getSubmission: async (id: string) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  getSubmissionsForRoom: async (roomId: string, userId?: string) => {
    const params = userId ? { userId } : {};
    const response = await api.get(`/submissions/room/${roomId}`, { params });
    return response.data;
  },
};
