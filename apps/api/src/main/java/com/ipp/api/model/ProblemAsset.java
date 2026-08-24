package com.ipp.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("problem_assets")
public class ProblemAsset implements Persistable<UUID> {

  @Id
  private UUID problemId;

  private String s3KeyTestsJson;

  @Transient
  private boolean isNew = true;

  public ProblemAsset(UUID problemId, String s3KeyTestsJson) {
    this.problemId = problemId;
    this.s3KeyTestsJson = s3KeyTestsJson;
  }

  @Override
  public UUID getId() {
    return this.problemId;
  }

  @Override
  public boolean isNew() {
    return this.isNew;
  }

}
