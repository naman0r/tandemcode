package com.ipp.api.controller;

import com.ipp.api.model.Problem;
import com.ipp.api.service.ProblemService;

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
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173")
public class ProblemController {

  private final ProblemService problemService;

  public ProblemController(ProblemService problemService) {
    this.problemService = problemService;
  }

  @GetMapping
  public Flux<Problem> getProblems(@RequestParam(required = false) String difficulty) {
    if (difficulty != null) {
      return problemService.getByDifficulty(difficulty);
    }
    return problemService.getAll();
  }

  @GetMapping("/{id}")
  public Mono<Problem> getProblemById(@PathVariable UUID id) {
    return problemService.getById(id);
  }

  @GetMapping("/slug/{slug}")
  public Mono<Problem> getProblemBySlug(@PathVariable String slug) {
    return problemService.getBySlug(slug);
  }

  @PostMapping
  public Mono<Problem> createProblem(@RequestBody CreateProblemRequest req) {
    return problemService.create(
        req.getSlug(),
        req.getTitle(),
        req.getDifficulty(),
        req.getTimeLimitMs(),
        req.getMemLimitMb()
    );
  }

  public static class CreateProblemRequest {
    private String slug;
    private String title;
    private String difficulty;
    private int timeLimitMs = 2000;
    private int memLimitMb = 256;

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(int timeLimitMs) { this.timeLimitMs = timeLimitMs; }

    public int getMemLimitMb() { return memLimitMb; }
    public void setMemLimitMb(int memLimitMb) { this.memLimitMb = memLimitMb; }
  }

}
