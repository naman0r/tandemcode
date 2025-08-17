package com.ipp.api.repository;

import com.ipp.api.model.RoomMember;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RoomMemberRepository extends ReactiveCrudRepository<RoomMember, Object> {



  // Find all users in a specific room
  Flux<RoomMember> findByRoomId(String roomId);

  // Remove a specific user from a specific room
  Mono<Void> deleteByRoomIdAndUserId(String roomId, String userId);

  // Check if a user is in a specific room
  Mono<Boolean> existsByRoomIdAndUserId(String roomId, String userId);

}
