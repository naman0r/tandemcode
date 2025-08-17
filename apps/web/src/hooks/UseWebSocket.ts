// custom hook
import { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";

interface ChatMessage {
  id: string;
  text: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
}

const useWebSocket = (roomId: string) => {
  // connection management
  // message sending/recieving
  // connection state tracking
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  const { clerkUser } = useUser();
  const userId = clerkUser?.id;

  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    } else {
      console.log("websocket not connected, cannot send mesage");
    }
  };

  useEffect(() => {
    if (!roomId || !userId) return; // Wait for both roomId and userId

    // set connection state
    setConnectionState("connecting");
    setIsConnected(false);

    // create websocket connection
    const ws = new WebSocket(
      `ws://localhost:8080/ws/room/${roomId}?userId=${userId}`
    );
    wsRef.current = ws;

    // when the connection opens:
    ws.onopen = () => {
      console.log("Connected to room: ", roomId);
      setIsConnected(true);
      setConnectionState("connected");
    };

    // when we receive a message:
    ws.onmessage = (event) => {
      console.log("received message", event.data);

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: event.data,
        username: "Other user", // improve later
        timestamp: new Date(),
        isOwn: false,
      };

      // add message to our messages array.....
      setMessages((prev) => [...prev, newMessage]);
    };

    // when the connection closes:
    ws.onclose = () => {
      console.log("Disconnectef from room: ", roomId);
      setIsConnected(false);
      setConnectionState("disconnected");
    };

    // when theres some error lol
    ws.onerror = (error) => {
      console.error("WebSocket error", error);
      setConnectionState("disconnected");
      setIsConnected(false);
    };

    // cleanup function - runs when the component unmounts
    return () => {
      ws.close();
    };
  }, [roomId, userId]); // reconnect when roomId or userId changes

  return {
    isConnected,
    messages,
    sendMessage,
    connectionState,
  };
};

export default useWebSocket;
