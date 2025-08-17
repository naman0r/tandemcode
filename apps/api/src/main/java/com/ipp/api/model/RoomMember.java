package com.ipp.api.model;

import org.springframework.data.relational.core.mapping.Table;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("room_members")
public class RoomMember {

  // this mapping will represent a many to many relationship
  // between rooms and users (BRIDGE TABLE, REMEMBER DATABASES)

  private String roomId; 
  private String userId; 

  private String role; 

  private OffsetDateTime joinedAt; 
  
}
