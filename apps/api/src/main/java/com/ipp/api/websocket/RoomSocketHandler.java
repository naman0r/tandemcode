package com.ipp.api.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.ipp.api.repository.RoomMemberRepository;
import com.ipp.api.repository.UserRepository;
import com.ipp.api.model.RoomMember;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;


@Component
public class RoomSocketHandler extends TextWebSocketHandler {
    
    // ROOM MANAGER: Maps roomId → Set of WebSocket sessions in that room
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    
    // Injected repositories for database operations
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    
    // Constructor injection
    public RoomSocketHandler(RoomMemberRepository roomMemberRepository, UserRepository userRepository) {
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
    }

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
