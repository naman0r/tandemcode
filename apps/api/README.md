# Readme for Spring Boot API.

<br/>

## Spring Data Magic:

The UserController (and all other controllers in the `controller` package need not be constructed in a single point (like ServiceAssembly in swift))

- dependency injection is one of Spring's COre concents, Spring calls anything annotated with @RestController automatically. The constructor is called by SPRING.

```java
dependency chain:

1. Creates UserRepository (because it is a @Respository)
2. Creates UserCOntroller, calls constructor with UserRepository
3. Registers UserController to handle /api/users requests.
```

- when requests come in, HTTP GET /api/users -> spring routes to UserController
  -> Calls the methods on the SAME INSTANCE that spring created.

```

key spring annotations:

@RestController = "Spring, manage this and handle HTTP requests"
@Repository = "Spring, manage this as a data access component"
@Service = "Spring, manage this as a business logic component"
@Component = "Spring, manage this as a general component"

```

- For any Repository Interface which extends ReactiveCrudRepository, Spring Data AUTOMATICALLY GENERATES THE REAL CLASS AT RUNTIME.

Mono<T> for one instance and Flux<T> for multiple instances.
<br/>

whelp

to run: ./gradlew bootRun --info

## Colaborative Rooms Architecture/ flow:

### backend

user joins room -> websocket connection -> room state updated -> broadcast to all room members

### frontend:

User Clicks Join room -> connect to a websocket -> send/receive real time messages (use toastify for notification service)
