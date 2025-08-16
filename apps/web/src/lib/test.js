// Test connection to room "test123"
const ws = new WebSocket("ws://localhost:8080/ws/room/test123");

ws.onopen = () => {
  console.log("✅ Connected!");
  ws.send("Hello from Node.js!");
};
ws.onmessage = (event) => console.log("📨 Received:", event.data);
ws.onclose = () => console.log("❌ Disconnected");
ws.onerror = (error) => console.error("🚨 Error:", error);
