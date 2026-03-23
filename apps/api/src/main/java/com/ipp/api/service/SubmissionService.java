package com.ipp.api.service;

import com.ipp.api.model.Submission;
import com.ipp.api.repository.ProblemRepository;
import com.ipp.api.repository.RoomRepository;
import com.ipp.api.repository.SubmissionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class SubmissionService {

  private final SubmissionRepository submissionRepository;
  private final ProblemRepository problemRepository;
  private final RoomRepository roomRepository;

  public SubmissionService(SubmissionRepository submissionRepository,
                           ProblemRepository problemRepository,
                           RoomRepository roomRepository) {
    this.submissionRepository = submissionRepository;
    this.problemRepository = problemRepository;
    this.roomRepository = roomRepository;
  }

  public Mono<Submission> submit(String roomId, String userId, UUID problemId, String language, String code) {
    // Validate that room and problem exist before creating the submission
    Mono<Boolean> roomExists = roomRepository.existsById(roomId)
        .flatMap(exists -> exists
            ? Mono.just(true)
            : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found: " + roomId)));

    Mono<Boolean> problemExists = problemRepository.existsById(problemId)
        .flatMap(exists -> exists
            ? Mono.just(true)
            : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found: " + problemId)));

    return Mono.zip(roomExists, problemExists)
        .flatMap(tuple -> submissionRepository.save(new Submission(roomId, userId, problemId, language, code)));
  }

  public Mono<Submission> getById(UUID id) {
    return submissionRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found: " + id)));
  }

  public Flux<Submission> getByRoom(String roomId) {
    return submissionRepository.findByRoomId(roomId);
  }

  public Flux<Submission> getByRoomAndUser(String roomId, String userId) {
    return submissionRepository.findByRoomIdAndUserId(roomId, userId);
  }

}
