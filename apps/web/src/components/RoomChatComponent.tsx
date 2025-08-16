import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
}

interface RoomChatComponentProps {
  roomId?: string;
}

const RoomChatComponent: React.FC<RoomChatComponentProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([
    // Mock messages for UI demonstration
    {
      id: "1",
      text: "Hey! Ready to solve some problems?",
      username: "Sarah",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isOwn: false,
    },
    {
      id: "2",
      text: "Yes! Let's start with the two-sum problem",
      username: "You",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isOwn: true,
    },
    {
      id: "3",
      text: "Perfect! I'll create a brute force solution first",
      username: "Sarah",
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isOwn: false,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add new message (you'll replace this with WebSocket send)
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      username: "You",
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Room chat</h3>
            <p className="text-sm text-gray-600">
              {roomId ? `Room: ${roomId}` : "Room chat"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-xs text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isOwn ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md ${
                message.isOwn ? "order-1" : "order-2"
              }`}
            >
              {/* Username & Time */}
              <div
                className={`text-xs text-gray-500 mb-1 ${
                  message.isOwn ? "text-right" : "text-left"
                }`}
              >
                {message.username} • {formatTime(message.timestamp)}
              </div>

              {/* Message Bubble */}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.isOwn
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        {!isConnected && (
          <p className="text-xs text-gray-500 mt-2">
            Connect to start chatting...
          </p>
        )}
      </div>
    </div>
  );
};

export default RoomChatComponent;
