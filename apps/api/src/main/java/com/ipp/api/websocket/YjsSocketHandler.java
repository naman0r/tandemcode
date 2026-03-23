package com.ipp.api.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Binary WebSocket relay for Yjs CRDT synchronization.
 *
 * Yjs clients speak their own sync protocol (binary messages). This handler
 * acts as a dumb relay: it forwards every binary message to all other sessions
 * in the same room. Yjs clients handle CRDT merging themselves, so no server-
 * side document state is needed.
 *
 * Endpoint: /ws/yjs/{roomId}
 */
@Component
public class YjsSocketHandler extends AbstractWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(YjsSocketHandler.class);

    // roomId → set of active WebSocket sessions
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = extractRoomId(session);
        roomSessions.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.info("Yjs session connected: room={} session={}", roomId, session.getId());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String roomId = extractRoomId(session);
        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomId, Set.of());
        for (WebSocketSession other : sessions) {
            if (other.isOpen() && !other.getId().equals(session.getId())) {
                try {
                    other.sendMessage(message);
                } catch (IOException e) {
                    log.warn("Failed to relay Yjs message to session {}: {}", other.getId(), e.getMessage());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = extractRoomId(session);
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) roomSessions.remove(roomId);
        }
        log.info("Yjs session disconnected: room={} session={}", roomId, session.getId());
    }

    private String extractRoomId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }
}
