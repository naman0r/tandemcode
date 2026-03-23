package com.ipp.api.controller;

import com.ipp.api.model.Submission;
import com.ipp.api.service.SubmissionService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "http://localhost:5173")
public class SubmissionController {

  private final SubmissionService submissionService;

  public SubmissionController(SubmissionService submissionService) {
    this.submissionService = submissionService;
  }

  @PostMapping
  public Mono<Submission> submit(@Valid @RequestBody SubmitRequest req) {
    return submissionService.submit(
        req.getRoomId(),
        req.getUserId(),
        req.getProblemId(),
        req.getLanguage(),
        req.getCode()
    );
  }

  @GetMapping("/{id}")
  public Mono<Submission> getSubmission(@PathVariable UUID id) {
    return submissionService.getById(id);
  }

  @GetMapping("/room/{roomId}")
  public Flux<Submission> getByRoom(
      @PathVariable String roomId,
      @RequestParam(required = false) String userId) {
    if (userId != null) {
      return submissionService.getByRoomAndUser(roomId, userId);
    }
    return submissionService.getByRoom(roomId);
  }

  public static class SubmitRequest {
    @NotBlank private String roomId;
    @NotBlank private String userId;
    @NotNull  private UUID problemId;
    @NotBlank private String language;
    @NotBlank private String code;

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public UUID getProblemId() { return problemId; }
    public void setProblemId(UUID problemId) { this.problemId = problemId; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
  }

}
