package com.ipp.api.websocket;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public class RoomSocketHandler extends TextWebSocketHandler {
    
    // ROOM MANAGER: Maps roomId → Set of WebSocket sessions in that room
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    //  HELPER: Extract room ID from WebSocket URL
    private String getRoomId(WebSocketSession session) {
        String path = session.getUri().getPath(); // "/ws/room/room123"
        return path.substring(path.lastIndexOf('/') + 1); // "room123"
    }

    // called when someone connects
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = getRoomId(session);
        
        // Add this session to the room
        roomSessions.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
        
        System.out.println("User connected to room: " + roomId +
                " (Total in room: " + roomSessions.get(roomId).size() + ")");
    }

  // Called when someone sends a message
  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
      String roomId = getRoomId(session);
      Set<WebSocketSession> roomMembers = roomSessions.get(roomId);
      
      if (roomMembers != null) {
          // 📢 BROADCAST: Send message to all users in this room
          roomMembers.forEach(memberSession -> {
              try {
                  if (memberSession.isOpen()) {
                      memberSession.sendMessage(message);
                  }
              } catch (Exception e) {
                  System.err.println("Error sending message: " + e.getMessage());
              }
          });
      }
  }

  // Called when someone disconnects
  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
      String roomId = getRoomId(session);
      Set<WebSocketSession> roomMembers = roomSessions.get(roomId);
      
      if (roomMembers != null) {
          roomMembers.remove(session);
          
          // Clean up empty rooms
          if (roomMembers.isEmpty()) {
              roomSessions.remove(roomId);
          }
          
          System.out.println("User disconnected from room: " + roomId +
                  " (Remaining: " + roomMembers.size() + ")");
      }
  }

}
