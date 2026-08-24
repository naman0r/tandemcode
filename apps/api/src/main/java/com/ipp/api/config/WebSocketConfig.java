package com.ipp.api.config;

import com.ipp.api.websocket.RoomSocketHandler;
import com.ipp.api.websocket.YjsSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;


/**
 * THis is a Config class for websockets. Implements the WebSocketConfigurer interface
 */
@Configuration // tells spring that this is a COnfig class.
@EnableWebSocket // enables web socket support
public class WebSocketConfig implements WebSocketConfigurer {


  private final RoomSocketHandler roomSocketHandler;
  private final YjsSocketHandler yjsSocketHandler;

  public WebSocketConfig(RoomSocketHandler roomSocketHandler, YjsSocketHandler yjsSocketHandler) {
    this.roomSocketHandler = roomSocketHandler;
    this.yjsSocketHandler = yjsSocketHandler;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    // Chat / presence
    registry.addHandler(roomSocketHandler, "/ws/room/*")
            .setAllowedOrigins("*");

    // Yjs CRDT binary relay for collaborative editing
    registry.addHandler(yjsSocketHandler, "/ws/yjs/*")
            .setAllowedOrigins("*");
  }
}
