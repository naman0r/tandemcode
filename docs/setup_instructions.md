# Spring Boot API Setup (WebFlux + R2DBC + SQS) — Step‑by‑Step

This guide boots your **`apps/api`** service with Spring Boot **WebFlux**, **R2DBC Postgres**, and an **SQS** publisher. It’s minimal, production‑leaning, and matches the MVP architecture from the planning README.

> **Prereqs**: Java 21 (Temurin/Zulu), Gradle 8.x, Docker, a local Postgres (we’ll use Compose), and AWS creds on your machine (`aws configure`) for SQS later.

---

## 1) Scaffold the project

### Option A — Use Spring Initializr (GUI)

- **Project**: Gradle – Kotlin DSL (or Groovy if you prefer)
- **Language**: Java
- **Java**: 21
- **Group**: `com.ipp`
- **Artifact**: `api`
- **Dependencies**:

  - **Reactive Web** (WebFlux)
  - **Data R2DBC**
  - **Validation**
  - **Actuator**
  - **Flyway**
  - **Lombok** (optional)

Download and unzip into `apps/api`.

### Option B — Curl Initializr (scriptable)

```bash
cd apps
curl -s https://start.spring.io/starter.zip \
  -d dependencies=webflux,data-r2dbc,validation,actuator,flyway,lombok \
  -d name=api -d groupId=com.ipp -d artifactId=api -d javaVersion=21 \
  -d type=gradle-project -o api.zip
unzip api.zip -d api && rm api.zip
```

> We’ll add **AWS SDK v2 (SQS)** and **R2DBC Postgres** driver manually below.

---

## 2) Add dependencies (Gradle)

**`apps/api/build.gradle.kts`** (baseline)

```kotlin
plugins {
    id("org.springframework.boot") version "3.3.3"
    id("io.spring.dependency-management") version "1.1.5"
    java
}

group = "com.ipp"
version = "0.0.1-SNAPSHOT"
java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")

    // Postgres drivers: R2DBC for runtime, JDBC for Flyway migrations
    runtimeOnly("org.postgresql:r2dbc-postgresql:1.0.5.RELEASE")
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    // AWS SDK v2 – SQS (later you can add S3, CloudWatch, etc.)
    implementation(platform("software.amazon.awssdk:bom:2.25.60"))
    implementation("software.amazon.awssdk:sqs")

    // JSON
    implementation("com.fasterxml.jackson.core:jackson-databind")

    // Lombok (optional)
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> { useJUnitPlatform() }
```

> If you prefer **Groovy Gradle**, mirror these deps in `build.gradle` instead of `build.gradle.kts`.

---

## 3) Configure application properties

**`apps/api/src/main/resources/application.yml`**

```yaml
server:
  port: 8080

spring:
  application:
    name: ipp-api
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/ipp_dev
    username: ipp
    password: ipp
  flyway:
    enabled: true
    url: jdbc:postgresql://localhost:5432/ipp_dev
    user: ipp
    password: ipp
  jackson:
    serialization:
      WRITE_DATES_AS_TIMESTAMPS: false

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics

app:
  sqs:
    # For local dev, you can point to LocalStack or leave empty for now
    queueUrl: ${SQS_QUEUE_URL:}
aws:
  region: ${AWS_REGION:us-east-1}
```

> **Why both R2DBC and JDBC URLs?** R2DBC is used by the app for reactive DB access; **Flyway** still uses JDBC to run migrations at startup.

---

## 4) Local Postgres (Docker Compose)

Add a simple dev database you can throw away and recreate.

**`apps/api/docker-compose.yml`**

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    container_name: ipp-db
    environment:
      POSTGRES_DB: ipp_dev
      POSTGRES_USER: ipp
      POSTGRES_PASSWORD: ipp
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
```

Run it:

```bash
cd apps/api
docker compose up -d
```

---

## 5) First migration (Flyway)

Create the schema you sketched in the planning doc.

**`apps/api/src/main/resources/db/migration/V1__init.sql`**

```sql
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references users(id),
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id uuid not null references rooms(id),
  user_id uuid not null references users(id),
  role text not null default 'participant',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  difficulty text,
  time_limit_ms int not null default 2000,
  mem_limit_mb int not null default 256
);

create table if not exists problem_assets (
  problem_id uuid primary key references problems(id),
  s3_key_tests_json text not null
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  user_id uuid not null references users(id),
  problem_id uuid not null references problems(id),
  language text not null,
  status text,
  time_ms int,
  created_at timestamptz not null default now(),
  s3_key_stdout text,
  s3_key_stderr text,
  s3_key_result_json text
);

create table if not exists events (
  id bigserial primary key,
  room_id uuid not null references rooms(id),
  ts timestamptz not null default now(),
  type text not null,
  payload_json jsonb not null
);
```

> If you get `gen_random_uuid()` errors locally, enable the extension:
>
> ```sql
> create extension if not exists pgcrypto;
> ```
>
> Add that as the first line of the migration if needed.

---

## 6) Minimal code — boot the app

### Main application class

**`apps/api/src/main/java/com/ipp/ApiApplication.java`**

```java
package com.ipp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(ApiApplication.class, args);
  }
}
```

### Health & sample REST endpoint

**`apps/api/src/main/java/com/ipp/http/HelloController.java`**

```java
package com.ipp.http;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
  @GetMapping("/api/hello")
  public String hello() { return "IPP API up"; }
}
```

---

## 7) WebSocket (raw JSON over WS, WebFlux style)

We’ll register a WebSocket handler at `/ws/rooms/{roomId}`. For MVP it echoes messages; you’ll swap in your CRDT room hub later.

**`apps/api/src/main/java/com/ipp/ws/WebSocketConfig.java`**

```java
package com.ipp.ws;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.Map;

@Configuration
public class WebSocketConfig {
  @Bean
  public SimpleUrlHandlerMapping handlerMapping(RoomSocketHandler handler) {
    var map = Map.<String, WebSocketHandler>of("/ws/rooms/{roomId}", handler);
    var mapping = new SimpleUrlHandlerMapping();
    mapping.setUrlMap(map);
    mapping.setOrder(-1); // before annotated controllers
    return mapping;
  }

  @Bean
  public WebSocketHandlerAdapter handlerAdapter() {
    return new WebSocketHandlerAdapter();
  }
}
```

**`apps/api/src/main/java/com/ipp/ws/RoomSocketHandler.java`**

```java
package com.ipp.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class RoomSocketHandler implements WebSocketHandler {
  @Override
  public Mono<Void> handle(WebSocketSession session) {
    // Quick way to read roomId from the path
    var path = session.getHandshakeInfo().getUri().getPath(); // /ws/rooms/<roomId>
    var roomId = path.substring(path.lastIndexOf('/') + 1);

    Flux<WebSocketMessage> output = session.receive()
        .map(WebSocketMessage::getPayloadAsText)
        .map(text -> "room:" + roomId + " echo:" + text)
        .map(session::textMessage);

    return session.send(output);
  }
}
```

> Later you’ll replace this with a **RoomHub** that tracks presence, broadcasts Yjs updates, and pushes verdict events.

---

## 8) R2DBC entity + repository (sample)

**`apps/api/src/main/java/com/ipp/model/Room.java`**

```java
package com.ipp.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Table("rooms")
public class Room {
  @Id public UUID id;
  public UUID created_by_user_id;
  public String status;
  public OffsetDateTime created_at;
}
```

**`apps/api/src/main/java/com/ipp/repo/RoomRepo.java`**

```java
package com.ipp.repo;

import com.ipp.model.Room;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface RoomRepo extends ReactiveCrudRepository<Room, UUID> {}
```

---

## 9) SQS publisher (enqueue a run)

**`apps/api/src/main/java/com/ipp/service/RunQueueService.java`**

```java
package com.ipp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Service
public class RunQueueService {
  private final SqsAsyncClient sqs;
  private final ObjectMapper om;
  private final String queueUrl;

  public RunQueueService(
      @Value("${aws.region}") String region,
      @Value("${app.sqs.queueUrl}") String queueUrl,
      ObjectMapper om
  ) {
    this.sqs = SqsAsyncClient.builder()
        .region(Region.of(region))
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    this.queueUrl = queueUrl;
    this.om = om;
  }

  public Mono<Void> enqueueSubmission(UUID submissionId, UUID problemId) {
    try {
      var body = om.writeValueAsString(Map.of(
          "submission_id", submissionId.toString(),
          "problem_id", problemId.toString()
      ));
      var req = SendMessageRequest.builder()
          .queueUrl(queueUrl)
          .messageBody(body)
          .build();
      return Mono.fromFuture(sqs.sendMessage(req)).then();
    } catch (Exception e) {
      return Mono.error(e);
    }
  }
}
```

> For **local dev without AWS**, you can point the client at **LocalStack** by adding `.endpointOverride(URI.create("http://localhost:4566"))` and setting up a test queue.

---

## 10) Wire an endpoint to the queue (placeholder)

**`apps/api/src/main/java/com/ipp/http/RunController.java`**

```java
package com.ipp.http;

import com.ipp.service.RunQueueService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
public class RunController {
  private final RunQueueService runs;
  public RunController(RunQueueService runs) { this.runs = runs; }

  @PostMapping("/api/runs")
  public Mono<Void> enqueue(@RequestParam UUID submissionId, @RequestParam UUID problemId) {
    return runs.enqueueSubmission(submissionId, problemId);
  }
}
```

---

## 11) Run it

```bash
# 1) Start Postgres
cd apps/api && docker compose up -d

# 2) Set env (optional for now)
export AWS_REGION=us-east-1
export SQS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/123456789012/ipp-dev-runs"

# 3) Boot the API
./gradlew bootRun
```

- Visit **`http://localhost:8080/api/hello`** → should return `IPP API up`.
- Test WebSocket quickly:

  - With a browser WS client (or `wscat`): connect to `ws://localhost:8080/ws/rooms/test123` and send a message, you should get an echo.

---

## 12) Frontend ↔ API quick integration

In `apps/web`, add a `.env.local`:

```
VITE_API_BASE=http://localhost:8080
VITE_WS_BASE=ws://localhost:8080
```

Use `fetch("${VITE_API_BASE}/api/hello")` and a `WebSocket(`\${VITE_WS_BASE}/ws/rooms/\${roomId}`)` to verify end‑to‑end.

---

## 13) Next steps (API)

- [ ] Add **RoomHub** that keeps a map of `roomId -> Sinks.Many<WebSocketMessage>>` and broadcasts messages to members.
- [ ] Define DTOs for room presence, editor ops, and verdict events.
- [ ] Implement **auth** adapter (Clerk first) and pass a JWT over WS (query/header) → validate on connect.
- [ ] Add **Flyway** migration for initial problems and a seed script.
- [ ] Create a **runner** app (separate service) that polls SQS and starts ECS Fargate tasks per submission.
- [ ] Add **CloudWatch** logging configuration and structured logs (JSON).

---

### Troubleshooting

- **Flyway can’t connect** → double-check `spring.flyway.url/user/password`; Flyway uses **JDBC**, not R2DBC.
- **R2DBC connection refused** → is Docker Postgres up? Is the port `5432:5432` exposed?
- **WebSocket 404** → ensure `WebSocketConfig` mapping path matches your client URL exactly.
- **SQS permissions** → if you test against real AWS, your IAM user must have `sqs:SendMessage` on that queue.

---

That’s your minimal, clean Spring Boot API setup aligned with the project design. When you’re ready, I can add a small **RoomHub** broadcast implementation and a skeleton **Terraform** for SQS + ECS.
