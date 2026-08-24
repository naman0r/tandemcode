package com.ipp.api.service;

import com.ipp.api.model.Problem;
import com.ipp.api.repository.ProblemRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class ProblemService {

  private final ProblemRepository problemRepository;

  public ProblemService(ProblemRepository problemRepository) {
    this.problemRepository = problemRepository;
  }

  public Flux<Problem> getAll() {
    return problemRepository.findAll();
  }

  public Flux<Problem> getByDifficulty(String difficulty) {
    return problemRepository.findByDifficulty(difficulty);
  }

  public Mono<Problem> getById(UUID id) {
    return problemRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found: " + id)));
  }

  public Mono<Problem> getBySlug(String slug) {
    return problemRepository.findBySlug(slug)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found: " + slug)));
  }

  public Mono<Problem> create(String slug, String title, String difficulty, int timeLimitMs, int memLimitMb) {
    return problemRepository.findBySlug(slug)
        .flatMap(existing -> Mono.<Problem>error(
            new ResponseStatusException(HttpStatus.CONFLICT, "Problem with slug already exists: " + slug)))
        .switchIfEmpty(Mono.defer(() ->
            problemRepository.save(new Problem(slug, title, difficulty, timeLimitMs, memLimitMb))
        ));
  }

}
