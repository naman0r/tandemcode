package com.ipp.api.repository;

import com.ipp.api.model.User;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Mono;


/**
 * This is the User Repository of the project. It extends ReactiveCrudRepository procided by
 * the springboot data API, which helps us (look at interface definition)
 */
public interface UserRepository extends ReactiveCrudRepository<User, String> {

  // Spring Data automatically provides:
  // - save(User user) -> Mono<User>
  // - findById(String id) -> Mono<User>
  // - findAll() -> Flux<User>
  // - deleteById(String id) -> Mono<Void>

  // Custom methods for my Clerk integration:
  Mono<User> findByEmail(String email);
  Mono<Boolean> existsByEmail(String email);

}
