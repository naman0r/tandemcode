package com.ipp.api.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


// @Data // generates a lot of boilerplate code of POJOs (plain old java objects


/**
 * A Basic User model for our application. To be iterated on.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("users")
public class User implements Persistable<String> {

  @Id // primary Key
  private String id; // clerk user id

  private String email;
  private String name;

  private OffsetDateTime createdAt; // offsetDateTime is better for postgresql timestampz

  @Transient
  private boolean isNew = true; // Flag to indicate if this is a new entity

  /**
   * Basic constructor which allows us to create User objects in our backend using data from clerk
   * @param id id
   * @param email email
   * @param name name
   */
  public User(String id, String email, String name) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = OffsetDateTime.now();
  }

  // Implement Persistable interface methods
  @Override
  public boolean isNew() {
    return isNew;
  }

  // Called after saving to mark as no longer new
  public void markNotNew() {
    this.isNew = false;
  }
}
