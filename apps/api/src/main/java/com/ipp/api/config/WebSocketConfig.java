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

  @Override // this is where we will add our setup.....
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

    registry.addHandler(new RoomSocketHandler(), "/ws/room/*")
            .setAllowedOrigins("*");

  }
}
