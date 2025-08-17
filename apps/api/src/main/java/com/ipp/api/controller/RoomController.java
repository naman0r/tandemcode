package com.ipp.api.controller;


import com.ipp.api.model.Room;
import com.ipp.api.model.RoomMember;
import com.ipp.api.repository.RoomMemberRepository;
import com.ipp.api.repository.RoomRepository;
import com.ipp.api.repository.UserRepository;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:5173")
public class RoomController {

  private final RoomRepository roomRepository;
  private final UserRepository userRepository;
  private final RoomMemberRepository roomMemberRepository;

  public RoomController(RoomRepository roomRepository,
                        UserRepository userRepository,
                        RoomMemberRepository roomMemberRepository) {
    this.roomRepository = roomRepository;
    this.userRepository = userRepository;
    this.roomMemberRepository = roomMemberRepository;
  }


  @PostMapping
  public Mono<Room> createRoom(@RequestBody CreateRoomRequest req) {
    // Generate unique ID in controller (best practice for business logic)
    String roomId = UUID.randomUUID().toString();
    
    Room room = new Room(roomId, req.getName(), req.getDescription(), req.getCreatedBy());
    return roomRepository.save(room);
  }
  
  // Get room by ID
  @GetMapping("/{id}")
  public Mono<Room> getRoom(@PathVariable String id) {
    return roomRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found with id: " + id)));
  }
  
  // Get all active rooms
  @GetMapping
  public Flux<Room> getAllActiveRooms() {
    return roomRepository.findByIsActiveTrue();
  }
  
  // Get rooms by creator
  @GetMapping("/user/{userId}")
  public Flux<Room> getRoomsByCreator(@PathVariable String userId) {
    return roomRepository.findByCreatedByAndIsActiveTrue(userId);
  }



  @GetMapping("/{roomId}/members")
  public Flux<UserInRoom> getRoomMembers (@PathVariable String roomId) {
    // 1. Find all room members by roomId
    // 2. For each member, get user details from users table
    // 3. Combine the data and return

    return roomMemberRepository.findByRoomId(roomId)
            .flatMap(roomMember ->
                    userRepository.findById(roomMember.getUserId())
                            .map(user -> new UserInRoom(
                                    user.getId(),
                                    user.getName(),
                                    user.getEmail(),
                                    roomMember.getRole(),
                                    roomMember.getJoinedAt()
                            ))

                    );




  }

  // DTO class type
  public static class UserInRoom {

    private String userId;
    private String name;
    private String email;
    private String role;
    private OffsetDateTime joinedAt;


    // Constructor
    public UserInRoom(String userId, String name, String email, String role, OffsetDateTime joinedAt) {
      this.userId = userId;
      this.name = name;
      this.email = email;
      this.role = role;
      this.joinedAt = joinedAt;
    }

    // Getters
    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }


  }





  // DTO class (Data Transfer Object):
  public static class CreateRoomRequest {
    private String name;
    private String description;
    private String createdBy;
    
    // Note: isActive and createdAt are set automatically by Room constructor
    
    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
  }

}
