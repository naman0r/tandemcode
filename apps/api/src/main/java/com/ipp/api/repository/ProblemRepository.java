package com.ipp.api.repository;

import com.ipp.api.model.Problem;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProblemRepository extends ReactiveCrudRepository<Problem, UUID> {

  Mono<Problem> findBySlug(String slug);

  Flux<Problem> findByDifficulty(String difficulty);

}
