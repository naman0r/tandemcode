package com.ipp.api;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class HelloController {

  @GetMapping("/")
  public Mono<String> hello() {

    return Mono.just("Hello World with webflux!!");

  }

  // Example of streaming data - returns numbers 1-5 with 1 second delay between each
  @GetMapping(value = "/stream", produces = "text/event-stream")
  public Flux<String> stream() {
    return Flux.interval(Duration.ofSeconds(1))
            .take(5)
            .map(sequence -> "Data #" + sequence);
  }



}
