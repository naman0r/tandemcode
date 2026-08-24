package com.ipp.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("submissions")
public class Submission {

  public static final String STATUS_PENDING = "pending";
  public static final String STATUS_RUNNING = "running";
  public static final String STATUS_ACCEPTED = "accepted";
  public static final String STATUS_WRONG_ANSWER = "wrong_answer";
  public static final String STATUS_ERROR = "error";

  @Id
  private UUID id;

  private String roomId;
  private String userId;
  private UUID problemId;
  private String language;
  private String code;
  private String status;
  private Integer timeMs;
  private OffsetDateTime createdAt;
  private String s3KeyStdout;
  private String s3KeyStderr;
  private String s3KeyResultJson;

  // Constructor for creating a new submission (id is null, DB generates it)
  public Submission(String roomId, String userId, UUID problemId, String language, String code) {
    this.roomId = roomId;
    this.userId = userId;
    this.problemId = problemId;
    this.language = language;
    this.code = code;
    this.status = STATUS_PENDING;
    this.createdAt = OffsetDateTime.now();
  }

}
