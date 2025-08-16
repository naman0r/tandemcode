package com.ipp.api.repository;

import com.ipp.api.model.Room;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RoomRepository extends ReactiveCrudRepository<Room, String> {

  // Find room by name (unique room names)
  Mono<Room> findByName(String name);
  
  // Find rooms created by a specific user
  Flux<Room> findByCreatedBy(String createdBy);
  
  // Find all active rooms
  Flux<Room> findByIsActiveTrue();
  
  // Find active rooms by creator
  Flux<Room> findByCreatedByAndIsActiveTrue(String createdBy);

}
