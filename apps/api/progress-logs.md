# TandemCode API Progress Log

## August 15, 2025 - Backend Foundation Complete ✅

### 🎯 What We Accomplished Today

Successfully set up a complete **Spring Boot WebFlux API** with **PostgreSQL integration** and **reactive CRUD operations** for User management. This forms the foundation for Clerk authentication integration and real-time pair programming features.

---

### 🏗️ Architecture Overview

```
Frontend (React + Clerk)
     ↓ HTTP/WebSocket
┌─────────────────────────────┐
│   Spring Boot WebFlux API   │
│   Port: 8080                │
│   ├─ UserController         │ ← REST endpoints for CRUD
│   ├─ UserRepository         │ ← R2DBC reactive queries
│   └─ User Entity            │ ← Maps to PostgreSQL table
└─────────────────────────────┘
     ↓ R2DBC (reactive)
┌─────────────────────────────┐
│   PostgreSQL Database       │
│   Port: 5432                │
│   └─ users table            │ ← Auto-created from schema.sql
└─────────────────────────────┘
```

---

### 🔧 Technical Stack Implemented

**Backend Framework**: Spring Boot 3.5.4 with WebFlux (reactive)
**Database**: PostgreSQL 13 (Docker container)
**ORM**: Spring Data R2DBC (reactive database access)
**Build Tool**: Gradle
**Java Version**: 21

---

### 📊 Database Architecture

**Connection Strategy**:

- **R2DBC** for reactive application queries (non-blocking)
- **Schema initialization** via Spring SQL initialization (schema.sql)
- **Auto DDL** disabled Flyway due to PostgreSQL version compatibility

**Users Table Schema**:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID (external)
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Design Decision**: Using Clerk's user ID as primary key instead of generating UUIDs

- ✅ **Pros**: Direct mapping, no ID translation needed
- ✅ **Cons**: Coupled to Clerk, but acceptable for MVP

---

### 🗂️ Spring Data R2DBC Mappings (The Confusing Parts Explained)

#### 1. **Entity-to-Table Mapping**

```java
@Table("users")                    // Maps to PostgreSQL "users" table
public class User implements Persistable<String> {
    @Id
    private String id;             // Maps to "id" column (TEXT PRIMARY KEY)
    private String email;          // Maps to "email" column
    private String name;           // Maps to "name" column
    private OffsetDateTime createdAt; // Maps to "created_at" column (TIMESTAMPTZ)
}
```

**Confusing Part**: Table/column naming conventions

- **Java**: camelCase (`createdAt`)
- **PostgreSQL**: snake_case (`created_at`)
- **Spring automatically converts** between these conventions

#### 2. **Persistable Interface (INSERT vs UPDATE Problem)**

```java
public class User implements Persistable<String> {
    @Transient
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;  // Tells Spring: "This is a new entity, use INSERT"
    }
}
```

**Why This Is Needed**:

- Spring R2DBC determines INSERT vs UPDATE based on whether entity "exists"
- With **assigned IDs** (Clerk IDs), Spring thinks entity exists → tries UPDATE → fails
- `Persistable` interface lets us explicitly tell Spring "this is new" → forces INSERT

#### 3. **Repository Pattern**

```java
public interface UserRepository extends ReactiveCrudRepository<User, String> {
    // Spring automatically provides:
    // - save(User) → Mono<User>         (INSERT/UPDATE)
    // - findById(String) → Mono<User>   (SELECT by ID)
    // - findAll() → Flux<User>          (SELECT all)

    // Custom query methods (Spring generates SQL from method names):
    Mono<User> findByEmail(String email);        // SELECT * FROM users WHERE email = ?
    Mono<Boolean> existsByEmail(String email);   // SELECT COUNT(*) > 0 FROM users WHERE email = ?
}
```

**Confusing Part**: Method name → SQL generation

- `findByEmail` → `WHERE email = ?`
- `findByNameContaining` → `WHERE name LIKE %?%`
- `existsByEmail` → `SELECT COUNT(*) > 0 WHERE email = ?`

---

### 🌐 Controller Layer (REST API Endpoints)

#### **Reactive Return Types**

```java
@GetMapping("/{id}")
public Mono<User> getUser(@PathVariable String id) {
    return userRepository.findById(id);  // Returns Mono<User> (0 or 1 result)
}

@GetMapping
public Flux<User> getAllUsers() {
    return userRepository.findAll();     // Returns Flux<User> (0 to N results)
}
```

**WebFlux Reactive Types**:

- **Mono<T>**: 0 or 1 result (like Optional, but async)
- **Flux<T>**: 0 to N results (like Stream, but async)
- **Non-blocking**: Doesn't tie up threads waiting for database

#### **API Endpoints Created**

- `POST /api/users` → Create user (for Clerk webhook)
- `GET /api/users/{id}` → Get user by ID (for frontend auth)
- `GET /api/users` → List all users (for testing/admin)

---

### 🐳 Infrastructure Setup

#### **PostgreSQL Docker Configuration**

```yaml
services:
  db:
    image: postgres:13 # Version 13 for better compatibility
    container_name: tandemcode-db
    environment:
      POSTGRES_DB: tandemcode_dev
      POSTGRES_USER: tandemcode
      POSTGRES_PASSWORD: tandemcode
    ports:
      - "5432:5432"
```

#### **Spring Boot Database Configuration**

```properties
# R2DBC Configuration (for reactive app)
spring.r2dbc.url=r2dbc:postgresql://localhost:5432/tandemcode_dev
spring.r2dbc.username=tandemcode
spring.r2dbc.password=tandemcode

# SQL Initialization (creates tables from schema.sql)
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
```

**Confusing Part**: R2DBC vs JDBC

- **R2DBC**: Reactive, non-blocking database driver (what our app uses)
- **JDBC**: Traditional blocking database driver (Flyway needs this)
- **Why both**: Flyway migrations need JDBC, app queries use R2DBC

---

### 🔄 Migration Strategy Evolution

#### **What We Tried (And Why Each Failed)**

1. **Flyway 11.7.2 + PostgreSQL 16** → Version incompatibility
2. **Flyway 11.7.2 + PostgreSQL 15** → Still incompatible
3. **Flyway 10.17.0 + PostgreSQL 14** → Still incompatible
4. **Spring SQL Init + schema.sql** → ✅ **Success!**

#### **Final Solution**: Spring Boot SQL Initialization

```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
```

**Why This Works**:

- Uses Spring's built-in SQL execution (not Flyway)
- Runs on app startup via R2DBC connection
- Simple but effective for development

---

### 🧪 Testing Results

#### **API Testing via curl**

```bash
# ✅ Create User
POST /api/users → 201 Created
Response: {"id":"user_clerk123","email":"test@example.com","name":"Test User","createdAt":"2025-08-15T17:56:19.991051+08:00","new":true}

# ✅ Get All Users
GET /api/users → 200 OK
Response: [{"id":"user_clerk123",...}]

# ✅ Get User by ID
GET /api/users/user_clerk123 → 200 OK
Response: {"id":"user_clerk123",...}

# ✅ Duplicate Prevention
POST /api/users (same ID) → 500 Duplicate Key Error (expected)
```

---

### 📋 Foundation Complete - Ready for Frontend Integration

**What's Working**:

- ✅ Reactive Spring Boot API with WebFlux
- ✅ PostgreSQL database with auto-schema creation
- ✅ User CRUD operations (Create, Read)
- ✅ Proper error handling for duplicates
- ✅ CORS configured for React frontend

**Next Steps**:

- 🔄 Connect React frontend with Clerk authentication
- 🔄 Implement user creation on Clerk signup (webhook)
- 🔄 Add WebSocket support for real-time collaboration
- 🔄 Create Room entity and pairing logic

**Architecture Foundation**: Solid reactive foundation ready to scale for real-time pair programming features.

## August 15th: 2025: Backend + Frontend Integrated; Clerk sign in -> backend -> psql -> confirmation.

## August 18th: WebSocket Handler still only uses Memory:

The Issue:
Your WebSocket handler currently:
Only tracks sessions in memory (roomSessions map)
Loses all presence data when server restarts
Can't identify which real users are connected
Can't show user profiles, names, or pictures
The Goal:
Transform it to:
Save real user presence to the room_members database table
Extract actual user IDs from WebSocket connections
Persist presence across server restarts
Enable displaying real user information
