package com.ipp.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("problems")
public class Problem {

  @Id
  private UUID id;

  private String slug;
  private String title;
  private String difficulty;
  private int timeLimitMs;
  private int memLimitMb;

  // Constructor for creating new problems (id is null, DB generates it)
  public Problem(String slug, String title, String difficulty, int timeLimitMs, int memLimitMb) {
    this.slug = slug;
    this.title = title;
    this.difficulty = difficulty;
    this.timeLimitMs = timeLimitMs;
    this.memLimitMb = memLimitMb;
  }

}
