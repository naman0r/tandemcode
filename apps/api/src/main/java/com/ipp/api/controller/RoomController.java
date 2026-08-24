package com.ipp.api.controller;


import com.ipp.api.model.Room;
import com.ipp.api.model.RoomMember;
import com.ipp.api.repository.ProblemRepository;
import com.ipp.api.repository.RoomMemberRepository;
import com.ipp.api.repository.RoomRepository;
import com.ipp.api.repository.UserRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
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
  private final ProblemRepository problemRepository;

  public RoomController(RoomRepository roomRepository,
                        UserRepository userRepository,
                        RoomMemberRepository roomMemberRepository,
                        ProblemRepository problemRepository) {
    this.roomRepository = roomRepository;
    this.userRepository = userRepository;
    this.roomMemberRepository = roomMemberRepository;
    this.problemRepository = problemRepository;
  }


  @PostMapping
  public Mono<Room> createRoom(@Valid @RequestBody CreateRoomRequest req) {
    String roomId = UUID.randomUUID().toString();
    Room room = new Room(roomId, req.getName(), req.getDescription(), req.getCreatedBy());
    return roomRepository.save(room);
  }

  @GetMapping("/{id}")
  public Mono<Room> getRoom(@PathVariable String id) {
    return roomRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found with id: " + id)));
  }

  @GetMapping
  public Flux<Room> getAllActiveRooms() {
    return roomRepository.findByIsActiveTrue();
  }

  @GetMapping("/user/{userId}")
  public Flux<Room> getRoomsByCreator(@PathVariable String userId) {
    return roomRepository.findByCreatedByAndIsActiveTrue(userId);
  }

  @GetMapping("/{roomId}/members")
  public Flux<UserInRoom> getRoomMembers(@PathVariable String roomId) {
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

  @PatchMapping("/{roomId}/problem")
  public Mono<Room> setCurrentProblem(@PathVariable String roomId,
                                      @Valid @RequestBody SetProblemRequest req) {
    return roomRepository.findById(roomId)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found: " + roomId)))
        .flatMap(room ->
            problemRepository.existsById(req.getProblemId())
                .flatMap(exists -> {
                  if (!exists) {
                    return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found: " + req.getProblemId()));
                  }
                  room.setCurrentProblemId(req.getProblemId());
                  room.markNotNew();
                  return roomRepository.save(room);
                })
        );
  }


  public static class UserInRoom {
    private String userId;
    private String name;
    private String email;
    private String role;
    private OffsetDateTime joinedAt;

    public UserInRoom(String userId, String name, String email, String role, OffsetDateTime joinedAt) {
      this.userId = userId;
      this.name = name;
      this.email = email;
      this.role = role;
      this.joinedAt = joinedAt;
    }

    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
  }

  public static class CreateRoomRequest {
    @NotBlank private String name;
    private String description;
    @NotBlank private String createdBy;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
  }

  public static class SetProblemRequest {
    @NotNull private UUID problemId;

    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }
  }

}
