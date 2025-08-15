package com.ipp.api.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("rooms")
public class Room implements Persistable<String> {

  @Id
  private String id;
  
  private String name;
  private String description;
  private String createdBy;
  private Boolean isActive;
  private OffsetDateTime createdAt;
  
  // Constants
  public static final int MAX_CAPACITY = 2; // can increase this in the future.
  // for MVP1 we only want the ability for a room to have 2 users

  @Transient
  private boolean isNew = true;


  // Constructor for creating new rooms
  public Room(String id, String name, String description, String createdBy) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.isActive = true;
    this.createdAt = OffsetDateTime.now();
  }



  @Override
  public String getId() {
    return this.id;
  }

  @Override
  public boolean isNew() {
    return this.isNew;
  }

  public void markNotNew() {
    this.isNew = false;
  }



}
