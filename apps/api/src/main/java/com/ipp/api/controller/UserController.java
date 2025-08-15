package com.ipp.api.controller;


import com.ipp.api.model.User;
import com.ipp.api.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController // ← This tells Spring "manage this class"
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173") // react frontend CORS.
public class UserController {

  private final UserRepository userRepository;

  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @PostMapping
  public Mono<User> createUser(@RequestBody CreateUserRequest request) {

    User user = new User(request.getId(), request.getEmail(), request.getName());
    return userRepository.save(user);
  }

  // Get user by ID (for frontend)
  @GetMapping("/{id}")
  public Mono<User> getUser(@PathVariable String id) {
    return userRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id)));
  }

  // Get all users (for testing)
  @GetMapping
  public Flux<User> getAllUsers() {
    return userRepository.findAll();
  }

  // request DTO (Data Transfer Object)
  public static class CreateUserRequest {
    private String id;
    private String email;
    private String name;

    public String getId() {return this.id; };
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
  }


}
