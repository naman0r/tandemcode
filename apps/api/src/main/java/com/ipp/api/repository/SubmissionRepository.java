package com.ipp.api.repository;

import com.ipp.api.model.Submission;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Flux;

import java.util.UUID;

public interface SubmissionRepository extends ReactiveCrudRepository<Submission, UUID> {

  Flux<Submission> findByRoomId(String roomId);

  Flux<Submission> findByUserId(String userId);

  Flux<Submission> findByRoomIdAndUserId(String roomId, String userId);

}
