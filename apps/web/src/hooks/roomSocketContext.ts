import { createContext, useContext } from "react";

export interface ChatMessage {
  id: string;
  text: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface RoomMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected";

interface RoomSocket {
  isConnected: boolean;
  connectionState: ConnectionState;
  messages: ChatMessage[];
  members: RoomMember[];
  sendMessage: (text: string) => void;
}

export const RoomSocketContext = createContext<RoomSocket | null>(null);

export const useRoomSocket = (): RoomSocket => {
  const socket = useContext(RoomSocketContext);
  if (!socket) {
    throw new Error("useRoomSocket must be rendered inside a RoomSocketProvider");
  }
  return socket;
};
