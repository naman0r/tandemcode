import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "./useUser";
import { RoomSocketContext } from "./roomSocketContext";
import type {
  ChatMessage,
  ConnectionState,
  RoomMember,
} from "./roomSocketContext";

/**
 * Owns the single room socket. Connection state, chat and presence all arrive on
 * it, so every consumer shares one connection rather than opening its own.
 */
export const RoomSocketProvider = ({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);

  const { clerkUser } = useUser();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const userId = clerkUser?.id;
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = (text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !clerkUser) return;

    ws.send(
      JSON.stringify({
        text,
        userId: clerkUser.id,
        username: clerkUser.fullName || clerkUser.firstName || "Unknown User",
        timestamp: new Date().toISOString(),
      })
    );
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    setConnectionState("connecting");
    setMembers([]);

    let ws: WebSocket | null = null;
    let cancelled = false;

    // The browser cannot send an Authorization header on a websocket, so the
    // session token goes in the query string. Fetching it makes this async, and
    // the effect can be torn down while we wait.
    const connect = async () => {
      const token = await getTokenRef.current();
      if (cancelled || !token) return;

      ws = new WebSocket(
        `ws://localhost:8080/ws/room/${roomId}?token=${encodeURIComponent(
          token
        )}`
      );
      wsRef.current = ws;

      ws.onopen = () => setConnectionState("connected");

      ws.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload.type === "presence") {
          setMembers(payload.members);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${prev.length}`,
            text: payload.text,
            username: payload.userId === userId ? "You" : payload.username,
            timestamp: new Date(payload.timestamp),
            isOwn: payload.userId === userId,
          },
        ]);
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        setMembers([]);
      };

      ws.onerror = (error) => {
        console.error("Room socket error", error);
        setConnectionState("disconnected");
      };
    };

    connect();

    return () => {
      cancelled = true;
      ws?.close();
      wsRef.current = null;
    };
  }, [roomId, userId]);

  return (
    <RoomSocketContext.Provider
      value={{
        isConnected: connectionState === "connected",
        connectionState,
        messages,
        members,
        sendMessage,
      }}
    >
      {children}
    </RoomSocketContext.Provider>
  );
};
