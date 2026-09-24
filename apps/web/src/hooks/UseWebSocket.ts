// custom hook
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { WS_BASE_URL } from "../lib/config";

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface RoomMember {
  userId: string;
  name: string | null;
  role: string;
  joinedAt: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface TestOutcome {
  index: number;
  hidden: boolean;
  passed: boolean;
  timeMs: number;
  stdout: string;
  stderr: string;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string | null;
  status: string;
  createdAt: string;
  result: { passed: number; total: number; timeMs: number; tests: TestOutcome[] } | null;
}

// Newest first; a submission arrives once as pending and again judged.
const upsert = (list: Submission[], next: Submission): Submission[] => {
  const rest = list.filter((item) => item.id !== next.id);
  // Compare instants, not strings: the API and the socket may format the
  // same time differently ("Z" vs "+00:00").
  return [next, ...rest].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

// Backoff for an unexpected drop. Bounded: a handshake the server refuses on
// policy will never start succeeding, so retrying forever just spins.
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000];

/**
 * The room's single websocket: connection state, chat and presence.
 *
 * Called once, by RoomView, which passes the pieces down. Calling it from each
 * consumer would open a connection per consumer.
 */
const useWebSocket = (roomId: string) => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  // The owner's latest switch, as an object so switching back to a problem
  // seen before is still a new value.
  const [problemChange, setProblemChange] = useState<{ problemId: string } | null>(null);

  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Text only. The server stamps the sender, display name and time, so this
    // cannot claim to be anyone.
    ws.send(JSON.stringify({ type: "chat", text }));
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    // A different room is a different conversation and a different roster.
    setMessages([]);
    setMembers([]);
    setProblemChange(null);
    setConnectionState("connecting");

    let disposed = false;
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;

    // The browser cannot send an Authorization header on a websocket, so the
    // session token goes in the query string. Fetching it makes this async, and
    // the effect can be torn down while we wait.
    const connect = async () => {
      const token = await getTokenRef.current();
      if (disposed) return;

      if (!token) {
        setConnectionState("disconnected");
        return;
      }

      const ws = new WebSocket(
        `${WS_BASE_URL}/ws/room/${roomId}?token=${encodeURIComponent(token)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setConnectionState("connected");
      };

      ws.onmessage = (event) => {
        if (disposed) return;

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

        if (payload.type === "problem") {
          setProblemChange({ problemId: payload.problemId });
          return;
        }

        if (payload.type === "submission") {
          setSubmissions((prev) => upsert(prev, payload.submission));
          return;
        }

        if (payload.type === "chat") {
          setMessages((prev) => [
            ...prev,
            {
              id: `${payload.userId}-${payload.timestamp}-${prev.length}`,
              userId: payload.userId,
              text: payload.text,
              username: payload.userId === userId ? "You" : payload.username,
              timestamp: new Date(payload.timestamp),
              isOwn: payload.userId === userId,
            },
          ]);
        }
      };

      // Both handlers bail when disposed, so a socket the cleanup already
      // closed cannot report state on behalf of the one replacing it.
      ws.onclose = () => {
        if (disposed) return;
        setConnectionState("disconnected");
        setMembers([]);

        const delay = RECONNECT_DELAYS_MS[attempt];
        if (delay === undefined) return;
        attempt += 1;
        // Reconnecting re-enters connect(), which fetches a fresh token; the
        // old one has very likely expired by now.
        retry = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        if (!disposed) setConnectionState("disconnected");
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retry);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomId, userId]);

  return {
    isConnected: connectionState === "connected",
    connectionState,
    messages,
    members,
    submissions,
    problemChange,
    // The socket only carries what happens while it is open; the room loads
    // history through this and reloads it after a reconnect.
    seedSubmissions: (history: Submission[]) =>
      setSubmissions((prev) => history.reduce(upsert, prev)),
    sendMessage,
  };
};

export default useWebSocket;
