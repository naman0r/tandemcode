package com.ipp.api.config;

import com.ipp.api.websocket.RoomSocketHandler;
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

  // we manually add RoomSocketHandler to our registery, which means:
  // Spring does not manage the object
  // Spring cannot inject dependencies (like repositories) into it
  // no @component @service @Repository magic works


  public WebSocketConfig(RoomSocketHandler roomSocketHandler) {
    this.roomSocketHandler = roomSocketHandler;
  }

  @Override // this is where we will add our setup.....
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

    registry.addHandler( roomSocketHandler, "/ws/room/*")
            .setAllowedOrigins("*");

  }
}
