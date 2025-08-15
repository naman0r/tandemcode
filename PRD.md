# TandemCode PRD - Learning-Focused Development Plan

> **Goal**: Build a real-time pair programming platform with code execution sandbox  
> **Timeline**: 8-10 weeks (7-10 hours/week)  
> **Learning focus**: Spring Boot + AWS fundamentals + Real-time systems

---

## 🎯 MVP Vision (What we're building)

A web platform where **2 people can**:

1. **Join a coding room** → see each other's cursors in real-time
2. **Write Python code together** in a shared Monaco editor (like VS Code)
3. **Hit "Run"** → code executes in a secure container → results appear instantly
4. **See test results** with hidden test cases and complexity analysis
5. **Replay the session** to review their collaboration

**Key Architecture**: React frontend ↔ Spring Boot API (WebSocket + REST) ↔ PostgreSQL + SQS → ECS containers

---

## 📚 Learning Path (Week by Week)

### **Week 1: Spring Boot Foundations** ✅ COMPLETED

**Goal**: Get comfortable with Spring Boot basics  
**What you'll learn**: REST APIs, dependencies, application properties, database connections

- [x] Set up Spring Boot project with WebFlux
- [x] Connect to PostgreSQL database
- [x] Create basic REST endpoints
- [x] Understand reactive programming basics (Mono/Flux)

**This week's achievement**: Working API that responds to HTTP requests!

---

### **Week 2: Database & Models (THIS WEEK)**

**Goal**: Learn Spring Data and create your core entities  
**What you'll learn**: JPA entities, R2DBC repositories, database relationships

**Tasks for you to code**:

- [ ] Create `User`, `Room`, `Problem` entity classes with proper annotations
- [ ] Build reactive repositories (`UserRepository`, `RoomRepository`)
- [ ] Create REST endpoints for creating/joining rooms
- [ ] Manual database table creation (since Flyway had issues)
- [ ] Test CRUD operations with Postman/curl

**Learning resources I'll provide**:

- Spring Data R2DBC examples
- Entity relationship guidance
- SQL scripts to create tables manually

**End goal**: You can create/fetch rooms and users via API calls

---

### **Week 3: WebSocket Real-time Basics**

**Goal**: Learn WebSocket fundamentals for real-time features  
**What you'll learn**: WebSocket handlers, session management, broadcasting

**Tasks for you to code**:

- [ ] Create WebSocket configuration and handlers
- [ ] Build a simple "room presence" system (who's in the room)
- [ ] Implement basic chat functionality via WebSocket
- [ ] Learn about session management and message routing

**End goal**: Two browser tabs can connect to same room and chat in real-time

---

### **Week 4: Frontend Integration**

**Goal**: Connect a simple frontend to your API  
**What you'll learn**: CORS, API integration, WebSocket clients

**Tasks for you to code**:

- [ ] Create basic HTML/JavaScript frontend (or simple React app)
- [ ] Connect to your REST APIs (create room, join room)
- [ ] Connect to WebSocket for real-time chat
- [ ] Handle connection states and error cases

**End goal**: Working web interface that can create rooms and chat

---

### **Week 5: Code Editor Integration**

**Goal**: Add Monaco Editor (VS Code engine) with basic collaboration  
**What you'll learn**: Frontend libraries, text synchronization

**Tasks for you to code**:

- [ ] Integrate Monaco Editor in your frontend
- [ ] Send code changes via WebSocket to backend
- [ ] Broadcast code changes to all room participants
- [ ] Handle cursor positions and basic presence

**End goal**: Shared code editor where two people can see each other type

---

### **Week 6: AWS SQS & Code Execution Setup**

**Goal**: Learn AWS basics and job queues  
**What you'll learn**: AWS SDK, SQS, Docker containers

**Tasks for you to code**:

- [ ] Add AWS SDK dependencies to your project
- [ ] Create SQS queue in AWS console (I'll guide you)
- [ ] Build REST endpoint that accepts code and sends job to SQS
- [ ] Create simple Docker container that can run Python code
- [ ] Build basic "runner" service that polls SQS

**End goal**: Clicking "Run" puts job in queue, simple runner picks it up

---

### **Week 7: Code Execution & Results**

**Goal**: Complete the code execution pipeline  
**What you'll learn**: Container security, result processing

**Tasks for you to code**:

- [ ] Enhance Python container with proper test execution
- [ ] Store execution results in S3 or database
- [ ] Send results back to frontend via WebSocket
- [ ] Add basic test case handling (pass/fail)

**End goal**: Full code execution pipeline - submit → run → get results

---

### **Week 8: Polish & Advanced Features**

**Goal**: Add the "teaching" features that make your platform special  
**What you'll learn**: Performance analysis, user experience

**Tasks for you to code**:

- [ ] Add complexity analysis (timing on different input sizes)
- [ ] Implement basic session replay functionality
- [ ] Add error handling and user feedback
- [ ] Create simple problem library with test cases

**End goal**: MVP platform with unique teaching features

---

## 🛠️ Technical Architecture (For your reference)

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   React Web     │ ←─────────────→  │  Spring Boot     │
│   Monaco Editor │    REST API      │  WebFlux API     │
└─────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   PostgreSQL     │
                                     │   (rooms, users) │
                                     └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │    AWS SQS       │
                                     │  (job queue)     │
                                     └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │  Runner Service  │
                                     │  (Docker exec)   │
                                     └──────────────────┘
```

---

## 🎓 Learning Philosophy

**I will provide**:

- ✅ Clear explanations of concepts before each week
- ✅ Code examples and templates to get you started
- ✅ Troubleshooting help when you're stuck
- ✅ Architecture guidance and best practices

**You will code**:

- ✅ All the actual implementation
- ✅ Entity classes, controllers, and business logic
- ✅ Frontend integration and user experience
- ✅ Problem-solving and debugging

**Goal**: By week 8, you'll understand Spring Boot, AWS basics, WebSockets, and have built a unique platform!

---

## 📋 Next Steps

1. **This week (Week 2)**: Focus on database entities and repositories
2. **I'll provide**: Entity templates and SQL scripts to get you started
3. **You'll code**: The actual classes and test them with API calls

**Ready to start Week 2?** Let me know and I'll give you the first small task for creating your `User` entity!
