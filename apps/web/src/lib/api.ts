import axios from "axios";
import { getSessionToken } from "./auth";
import { API_BASE_URL } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Every /api route requires a Clerk session token. Attaching it here means no
// call site has to remember to.
api.interceptors.request.use(async (config) => {
  const token = await getSessionToken();
  // Fail closed. Sending the request without a token would only turn a missing
  // session into a confusing 401 from the server.
  if (!token) {
    throw new Error("No Clerk session token available");
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type RoomVisibility = "public" | "unlisted";

export const userApi = {
  // Idempotent: mirrors the caller's Clerk profile into the backend. Email and
  // name come from Clerk server-side, so there is nothing to send.
  syncUser: async () => {
    const response = await api.post("/users");
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

  createRoom: async (roomData: {
    name: string;
    description: string;
    visibility: RoomVisibility;
    advertised: boolean;
  }) => {
    const response = await api.post("/rooms", roomData);
    return response.data;
  },

  // Owner only. Advertising needs a public room.
  setListing: async (roomId: string, listing: { visibility: RoomVisibility; advertised: boolean }) => {
    const response = await api.put(`/rooms/${roomId}/listing`, listing);
    return response.data;
  },

  // Rooms the caller created or joined; active=false is past sessions.
  getMyRooms: async (active: boolean) => {
    const response = await api.get("/rooms/mine", { params: { active } });
    return response.data;
  },

  getReplay: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/replay`);
    return response.data;
  },

  getMembersInRoom: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/members`);
    return response.data;
  },

  // Closes the room if it leaves nobody behind.
  leaveRoom: async (roomId: string) => {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data as { roomClosed: boolean };
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

  // The result arrives over the room socket, like a verdict.
  requestAnalysis: async (id: string) => {
    const response = await api.post(`/submissions/${id}/analysis`);
    return response.data;
  },

  getSubmissionsForRoom: async (roomId: string, userId?: string) => {
    const params = userId ? { userId } : {};
    const response = await api.get(`/submissions/room/${roomId}`, { params });
    return response.data;
  },
};
