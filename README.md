# TandemCode or CodeTandem

- buy domain tandemcode.xyz it is $2 on namecheap

**A real-time pair-programming + autograder platform** that focuses on collaboration quality, teaching signals (complexity, counterexamples), and a secure, scalable execution sandbox on AWS. This README is an early *planning* document: it defines goals, tradeoffs, architecture, folder layout, and an execution plan you can iterate on.

---

## 0) TL;DR — what I’m building

* **Web app first** (React + Monaco) with **two-person live coding rooms** (CRDT-based editor, presence, chat/voice optional later).
* **Run** executes code inside **ephemeral containers** with strict CPU/RAM/time/no-network constraints.
* **Problems** have **hidden tests** and a **complexity probe** (run on N, 2N, 4N to estimate time growth).
* **Early differentiators**: timeline replay, counterexample surfacing, collaboration metrics, “write tests that break others” mode.
* **Back end**: **Spring Boot (WebFlux)** or Go (alternative) with WebSocket realtime; jobs via **SQS**, runs on **ECS Fargate**, images in **ECR**, logs to **CloudWatch**, data in **RDS Postgres**.

> If momentum is a priority, ship **Python-only** MVP with SQS + Fargate and a single runner image. Add more languages and BYOR after MVP.

---

## 1) Product pillars

1. **Collab-first**: great low-latency editing, live cursors, ownership/talk-time balance, and **timeline replay** for coaching.
2. **Judge that teaches**: hidden tests + counterexamples; **complexity estimate** (input scaling); optional space usage estimate later.
3. **Safe & scalable**: one submission → one sandboxed container; easy to scale horizontally.
4. **Extensible**: a stable **judge contract** so problems can bring their own runtime (BYOR) in future phases.

### Things I’m *not* doing in MVP (explicit non‑goals)

* Massive language matrix (MVP: **Python only**).
* Full-blown proctoring suite (basic copy/paste + focus blur later).
* AI hints (could be a paid feature later; not needed for core value).

---

## 2) MVP scope (2–3 weeks of evenings)

**Languages**: Python 3.11

**Features**

* Create/join a room (2 participants), presence, live cursors, chat.
* CRDT editor (Yjs) with Monaco front-end; server relays updates.
* Problem picker → Run → verdict pane (stdout, stderr, status, time).
* Hidden tests + public samples; simple **complexity probe**.
* Timeline replay: record editor ops + run results; scrub to replay.

**Security**

* Per-run **Fargate task** with fixed CPU/RAM limits; **no outbound network**; read-only root; low ulimits; kill on timeout.

**Auth**

* Start with **Clerk** (fast) behind an auth gateway in the API.
* Keep an **AuthService** interface so I can swap to **Cognito** later (if I want “all AWS”).

**Hosting**

* **S3 + CloudFront** for the web. (If I want speed in dev, Vercel is fine and can be swapped later.)

---

## 3) Architecture overview

```
[Web (React + Monaco + Yjs)]
     |        ^    
     | WS     | WS
     v        |
[API/Realtime (Spring WebFlux)] ----> [Postgres (RDS)]
        |                 \
        | enqueue (SQS)    \
        v                   v
  [SQS Queue]         [S3: tests/results]
        |
        v
[ECS Fargate Runner Task]
   - pulls code/tests
   - runs judge inside container
   - writes result.json to S3
        |
        v  (notify via API)
[API pushes verdict via WebSocket]
```

### Key flows

1. **Realtime editing**: Web sockets connect to API; Yjs CRDT updates broadcast to room.
2. **Run**: API stores submission → sends job to SQS → Fargate runner spins up → executes → uploads `result.json` to S3 → API fetches & pushes verdict to room.
3. **Replay**: API stores editor ops + run events in `events` table; web replays with a scrubber.

---

## 4) Why Spring Boot + WebFlux? (and STOMP?)

* **WebFlux** is Spring’s reactive stack: great for many concurrent WS connections with fewer threads. It’s a good fit for realtime rooms.
* **STOMP over WebSocket** is a text messaging protocol (topics, acks) that Spring supports out‑of‑the‑box. It can simplify pub/sub semantics (rooms as topics). **But** STOMP adds overhead and locks you to a specific framing.

**Recommendation**: For MVP keep it **simple JSON over raw WebSocket** using Spring’s WS support. If you prefer Spring Messaging ergonomics and broker-style semantics, use STOMP; otherwise, raw WS + your own room/topic conventions is lighter and very common.

---

## 5) Events/Queues — Kafka vs MSK vs SQS/SNS (what these mean & what to pick)

* **Kafka**: distributed event log, partitions, high throughput, consumer groups, long retention. Great when you need to replay streams, strict ordering per partition, or multiple downstream consumers.
* **Redpanda**: Kafka‑compatible but simpler ops (no JVM/ZooKeeper); can be self-hosted or in their cloud.
* **MSK**: *Managed* Kafka on AWS. Powerful but **complex and pricey** for a small project.
* **SQS**: Simple Queue Service (FIFO/standard). Dead-simple **work queue** with at‑least‑once delivery. Perfect for **“run this job”** submissions.
* **SNS**: Pub/Sub notifications. Fan‑out to SQS queues, Lambda, HTTP endpoints.

**MVP Recommendation**: **SQS** for run submissions (it’s exactly a job queue). If/when you add multiple downstream consumers or event sourcing, introduce **SNS** to fan out or **Kafka/MSK** for streaming needs. Start simple.

---

## 6) Execution (ECS, Fargate, ECR, CloudWatch) — in plain English

* **ECS** (Elastic Container Service): AWS’s container orchestrator. Think “how to run containers reliably.”
* **Fargate**: ECS’s *serverless* compute. You don’t manage EC2 hosts; you just ask for N vCPU and M RAM and AWS runs your container.
* **ECR**: Elastic Container Registry — a private Docker registry for your images.
* **CloudWatch**: Logs + metrics. Your runner writes stdout/stderr/logs here for debugging and dashboards.

**How a run works**

1. API enqueues `{submission_id, problem_id}` to SQS.
2. A **runner service** (could be another Spring app or a small Go worker) polls SQS. For each message, it starts a **Fargate task** with the right image and mounts.
3. The task launches the **judge** inside the container (Python‑only MVP). The container has: fixed CPU/RAM, **no network**, read‑only root, tiny tmpfs.
4. Judge executes hidden/public tests, writes `result.json` to S3, exits.
5. Runner (or a callback) updates DB, and API pushes the verdict via WebSocket to the room.

**Time limits & safety**

* Enforce timeouts inside the judge (e.g., `subprocess.run(..., timeout=2.0)`), and kill tasks that exceed a wall clock in the worker.
* Set container **ulimits**, drop Linux capabilities, run as non‑root, and use `readonlyRootFilesystem`. Keep containers off the Internet.

---

## 7) BYOR (Bring Your Own Runtime) — phased plan

**Now (MVP)**: One Python 3.11 base image with a standard **judge contract**:

* Mounts: `/workspace/code` (user), `/workspace/tests` (problem)
* Env: `TIME_LIMIT_MS`, `MEM_LIMIT_MB`
* Output: `/workspace/result.json` with status, passed/total, timings, details

**Later**: Allow a problem to specify its own Docker image in a manifest (BYOR). The platform guarantees the contract; authors ship deps inside the image. Eventually add WASI for very fast startup on supported languages.

---

## 8) Data model (v1)

```sql
users(id, email, name, created_at)
rooms(id, created_by_user_id, status, created_at)
room_members(room_id, user_id, role, joined_at)
problems(id, slug, title, difficulty, time_limit_ms, mem_limit_mb)
problem_assets(problem_id, s3_key_tests_json)
submissions(id, room_id, user_id, problem_id, language, status, time_ms, created_at, s3_key_stdout, s3_key_stderr, s3_key_result_json)
events(id, room_id, ts, type, payload_json)  -- editor ops, run events for replay
```

---

## 9) Repository structure (monorepo)

```
interview-pep-peer/
├─ apps/
│  ├─ web/                       # React + Vite + Monaco + Yjs
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ editor/              # yjs bindings, presence, timeline
│  │  │  ├─ api/                 # thin client for API/ws
│  │  │  └─ state/
│  │  ├─ public/
│  │  └─ vite.config.ts
│  ├─ api/                       # Spring Boot (WebFlux)
│  │  ├─ src/main/java/com/ipp/
│  │  │  ├─ config/              # security, CORS, WebSocket
│  │  │  ├─ ws/                  # websocket handlers (raw JSON or STOMP)
│  │  │  ├─ http/                # REST controllers (rooms, problems, runs)
│  │  │  ├─ service/             # RoomService, RunService, AuthService
│  │  │  ├─ repo/                # JPA/R2DBC repositories
│  │  │  └─ model/               # entities + DTOs
│  │  ├─ src/main/resources/
│  │  └─ build.gradle
│  ├─ runner/                    # Worker that polls SQS and starts Fargate tasks
│  │  ├─ src/                    # can be Spring CLI or a small Go binary
│  │  └─ Dockerfile
│  └─ judge-images/
│     └─ python/
│        ├─ Dockerfile
│        ├─ runtime/judge.py
│        └─ tests/               # sample tests for Two Sum
├─ infra/
│  ├─ terraform/
│  │  ├─ envs/
│  │  │  ├─ dev/
│  │  │  └─ prod/
│  │  ├─ modules/
│  │  │  ├─ vpc/
│  │  │  ├─ rds/
│  │  │  ├─ ecs_cluster/
│  │  │  ├─ fargate_task/
│  │  │  ├─ sqs/
│  │  │  ├─ cognito/             # optional if/when you swap from Clerk
│  │  │  └─ s3_cloudfront/
│  │  └─ main.tf
│  └─ github-actions/            # CI/CD workflows
├─ docs/
│  ├─ architecture.md
│  ├─ judge-contract.md
│  └─ decisions/ADR-0001-queue-choice.md
├─ scripts/
│  ├─ dev-seed.sh
│  └─ local-run.sh               # docker run command with limits
├─ .editorconfig
├─ .gitignore
└─ README.md                     # THIS file
```

**Notes**

* Keep **runner** separate from the **API**: the API stays responsive even if runners are busy.
* Use **ADR** files (architecture decision records) in `/docs/decisions` to document choices like “SQS over Kafka for MVP.”

---

## 10) Local development workflow

* **Web**: `cd apps/web && pnpm dev`
* **API**: `cd apps/api && ./gradlew bootRun`
* **Postgres**: run via Docker Compose locally.
* **Judge image**: `docker build -t ipp-judge:py311 apps/judge-images/python`.
* **Local run (no AWS)**: use `scripts/local-run.sh` to execute the judge with `--network=none`, `--read-only`, tmpfs, and ulimits.
* **Seed**: `scripts/dev-seed.sh` loads Two Sum with sample tests.

### Minimal `.env` (dev)

```
DATABASE_URL=postgres://...
S3_BUCKET=ipp-dev
SQS_QUEUE_URL=...
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## 11) Deployment plan (AWS)

1. **Terraform**: VPC (private subnets, VPC endpoints for ECR/S3/Logs), RDS, S3 buckets (web, tests/results), ECR repos, SQS queue, ECS cluster, Fargate task defs.
2. **Build & push**: CI builds API/runner/judge images → **ECR**.
3. **Migrate DB**: Flyway/Liquibase on API startup.
4. **Web**: build → upload to **S3** → serve via **CloudFront**.
5. **Runtime**: API on Fargate service, Runner on Fargate service (polls SQS). Per‑submission **run** spawns a short‑lived Fargate task using the judge image.

**Cost control**

* Start with **t‑class** RDS (smallest), enable auto‑pause if using Aurora Serverless v2, or stop outside dev hours.
* Keep images **slim**; Fargate cost grows with duration and vCPU/MiB.
* Add a **Budget alert** in AWS Billing (email at \$20/\$50 threshold).

---

## 12) Realtime collab layer (CRDT vs OT)

* **CRDT (Yjs)**: conflict‑free merges, great offline & low-latency at scale; slightly more state per doc.
* **OT (ShareDB)**: smaller per‑doc state, but needs a central server to transform ops.

**Pick**: **Yjs** for MVP — simpler scaling, robust ecosystem (y-websocket/y-webrtc bindings), and great with Monaco.

**Timeline replay**: persist Yjs updates (or periodic snapshots + deltas) to `events`; client replays to visualize the session.

---

## 13) Complexity & counterexamples (teaching judge)

* **Complexity probe**: run on inputs scaled N, 2N, 4N (and maybe 8N) and record timings → estimate slope vs `n`.
* **Counterexamples**: if a solution fails property checks (e.g., for Two Sum, mismatched pair indices), generate or surface the smallest failing case from a fuzz set.

**MVP**: deterministic hidden tests + 1–2 scaled inputs. Save advanced counterexample generation for v2.

---

## 14) Security checklist (per run)

* `readonlyRootFilesystem: true`
* `--network=none` (or Fargate `disableNetworking: true`)
* Non‑root user; drop Linux capabilities
* Tight **ulimits**: `nofile`, `nproc`, `fsize`
* CPU/Mem hard limits; short wall‑clock timeout and worker **StopTask** fallback
* Read‑only mounts for code/tests; tmpfs `/tmp` only
* Sign images (cosign) and enable ECR vulnerability scans

---

## 15) Auth: Clerk now, Cognito later (how to keep it swappable)

* Create an `AuthService` interface in API (`getCurrentUser()`, `verifyToken()`), and provide `ClerkAuthService` + `CognitoAuthService` implementations.
* Front-end uses **Clerk** widgets to move fast. Later, you can swap to **Cognito Hosted UI** with minimal API changes.

---

## 16) Roadmap

**Phase 0 (MVP)**

* Python-only judge
* Rooms + CRDT editor + chat
* Run + verdict + complexity probe
* Basic timeline replay

**Phase 1**

* Test-writer mode (users earn points for breaking tests)
* PDF export (timings, complexity, collab metrics)
* Proctor‑lite (focus blur, paste events, code provenance diff)

**Phase 2**

* BYOR images in manifests
* Add Java/C++ images
* Classroom/bootcamp dashboards & assignments

**Phase 3**

* WASI runtime for ultra‑fast startup where feasible
* GPU sandbox tracks for ML‑style problems

---

## 17) FAQ — answering all the inline questions

**“CRDT/OT — what is this?”**

* CRDT lets multiple clients edit concurrently without a central lock, merging changes automatically. OT applies transformations on operations via a coordinator. Use **Yjs (CRDT)** for MVP.

**“STOMP over WebSocket — why?”**

* STOMP gives you broker-like topics/acks and is supported natively by Spring Messaging. It’s optional. You can just use raw WebSocket with JSON and simple room topics — lighter and common.

**“Kafka/Redpanda/MSK vs SQS/SNS — what the f**\* are these?”\*\*

* Kafka/Redpanda/MSK are **stream/event logs** used for high‑throughput streaming, replays, and multiple consumers. **SQS/SNS** are simpler AWS primitives: SQS = job queue; SNS = pub/sub notifications. For **“run this code”**, use **SQS** now.

**“S3 + CloudFront vs Vercel?”**

* Vercel = fastest to ship; S3 + CloudFront = AWS‑native, very cheap at scale. You can start on Vercel and move to S3+CF later — the app is static.

**“RDS vs Cloud SQL?”**

* Both are managed Postgres. If you want fewer clouds, stick to **RDS**. Control costs with small instance sizes and budgets.

**“ECS/Fargate/ECR/CloudWatch — explain like I’m five.”**

* ECR stores container images. ECS tells AWS *what* containers to run. Fargate is *where/how* they run without servers. CloudWatch is where logs/metrics go so you can see what happened.

**“Bring Your Own Runtime — I have no idea how to do this.”**

* Start with one Python judge image and a **judge contract**. Later, allow problems to reference their own Docker images that implement the same contract (mounts + env + `result.json`). The platform treats them uniformly.

**“Spring MVC vs WebFlux?”**

* MVC uses a thread per request — perfect for typical REST. **WebFlux** is non‑blocking (reactive) — better for many concurrent WS connections and streaming. For a realtime app, **WebFlux** is a good fit.

---

## 18) Acceptance criteria (MVP done when…)

* Two users can join a room, see each other’s cursors, and chat.
* User submits Python code → job hits SQS → Fargate task runs judge → verdict appears in UI in < 3–5s for small tests.
* Hidden tests can fail with a clear message; complexity probe reports timings.
* A simple **replay** shows the session timeline.
* Basic dashboards in CloudWatch show run counts and error rates.

---

## 19) Appendix — example judge contract (Python)

```text
Mounts
  /workspace/code   (read-only)   # user files
  /workspace/tests  (read-only)   # tests.json for the problem
  /workspace/out    (writable)    # results, artifacts

Environment
  TIME_LIMIT_MS=2000
  MEM_LIMIT_MB=256

Entrypoint
  /usr/local/bin/judge --code /workspace/code --tests /workspace/tests --out /workspace/out/result.json

Output JSON
{
  "status": "ACCEPTED|WRONG_ANSWER|TIMEOUT|RUNTIME_ERROR|COMPILE_ERROR",
  "passed": 12,
  "total": 15,
  "time_ms": 87,
  "details": [
    {"name":"tc_01","ok":true},
    {"name":"tc_02","ok":false,"stderr":"IndexError","counterexample":"[3, 3], 6"}
  ],
  "complexity_probe": {"n":[1,2,4], "ms":[1,2,5]}
}
```

---

## 20) Next steps (checklist)

* [ ] Initialize monorepo with `apps/web`, `apps/api`, `apps/runner`, `apps/judge-images/python`, `infra/terraform`.
* [ ] Web: Monaco + Yjs editor; room presence; WebSocket client.
* [ ] API: WebFlux WS hub (rooms, presence), REST for problems/runs.
* [ ] DB: create tables + migrations; seed Two Sum.
* [ ] Judge image: build Python 3.11 judge with tests.json contract.
* [ ] SQS queue + ECS cluster + Fargate task def (Terraform).
* [ ] Runner: poll SQS, start Fargate task, collect `result.json`, push via WS.
* [ ] CloudWatch dashboards + AWS Budget alerts.

---

**License**: TBD
