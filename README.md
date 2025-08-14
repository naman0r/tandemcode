# interview-pep-peer


## angles: 
- gamilifed competitive pair programming platform. Instead of jusr collaborative coding, make a gamified experience where there can be a timer for timed challenges, skill matching system whcih matches students of similar levels, etc. this is one angle. I don't really like it though.

- time complexity checks: auto grader runs N, 2N, 4N inputs to estimate time growth. Can also implement space complexity analysis.

- Test case contributer: users earn points by writing tests that break other's solutions.

- Interview modes
- proctor-lite features: copy-paste detection + code diffs
- Share PDF with stats on how long it took, complexity metrics and collaboration metrics.

- bring your own runtime: Each problem declares a Docker image (or WASI runtime) with preinstalled deps. Authors can publish “problem packs” (monetizable marketplace). Optional GPU sandbox for ML-style problems later (roadmap). [I have no idea how to do this yet]

# MVP Scope: 
- Languages: Only python supported
- Features: 2-person room; CRDT/OT (Conflict-free Replicated Data, Operational Transformation); "Run" with sandbox, problem bank with hidden tests, basic results pane (output, error, time, etc.) timeline replay
- Security: per-run container with CPU/mem/time limits, no outbound network,
- Auth: AWS cognito or Clerk. Go with Clerk first since less setup required and you can get momentum going.....
- Frontend: React + Monaco Editor (idk if I want to use NextJs, getting kind of bored of it. Maybe react + vite?) A macOS app with SwiftUi can be made easily later as a thin wrapper around the same realtime APIs


# Tech Stack: 
- API/Realtime: Spring Boot + WebFlux (reactive framework for spring, alternative to MVC in my understanding... do more research)
    - STOMP (over websocket???? why?)
 
- Events: Kafka/Redpanda (managed MSK later), or SQS/SNS start (what the fuck do all these mean????? please fucking explain)
- static hostong: S3 + CloudFront (or i could just use vercel and make my life easier)
- DB: RDS Postgres (AWS provided); Or GCP cloud sql bc im scared of getting charged a lot from aws for no reason......
- Execution: ECS Fargate tasks per run (no servers to manage) with prebuilt language images in ECR Hard limits via task defs; logs to CloudWatch
    - can you please fucking explain all of these in detail. Also draft a folder structure of the repo and what exactly it will look like. like the springboot backend and frontend and everythng else, how it should be structured.....








# the 'how?': 

```python
AWS bits (execution, storage, queues)

ECS: Elastic Container Service — runs your Docker containers.

Fargate: “serverless” compute for ECS — you run containers without managing servers.

ECR: Elastic Container Registry — stores your Docker images.

S3: Simple Storage Service — object storage (code blobs, logs, test files).

RDS: Relational Database Service — managed Postgres/MySQL.

ElastiCache (Redis): managed Redis for fast in-memory data (presence/rooms).

SQS: Simple Queue Service — job queue (send “run this code” messages).

SNS: Simple Notification Service — pub/sub notifications or fan-out.

MSK: Managed Streaming for Apache Kafka — managed Kafka (heavier than SQS/SNS).

VPC: Virtual Private Cloud — your private network on AWS.

EFS: Elastic File System — network filesystem if you need shared files.

CloudFront: AWS’s CDN — speeds up static assets worldwide.

Cognito: AWS auth/user management (Google login, email/password).
```
