# Architecture — Logical View

> UML 4+1 Logical View. Layered decomposition of the platform into packages.
> Verified against `backend_services/*` and `docs/02-architecture.md`. Generated 2026-06-02.

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        WEB["Next.js SPA<br/>(frontend-nextjs)"]
    end

    subgraph Edge["Edge / Gateway Layer"]
        GW["API Gateway (Express)<br/>CORS · rate-limit · JWT verify<br/>access-policy (RBAC)<br/>x-user-* header inject<br/>HTTP + WebSocket proxy"]
    end

    subgraph Services["Application Service Layer (microservices)"]
        AUTH["auth_service<br/>(NestJS)<br/>login · JWT · OAuth · OTP · refresh"]
        USER["user_service<br/>(NestJS)<br/>profile · roles · lecturer requests · follows · audit"]
        COURSE["course_service<br/>(NestJS)<br/>courses · lessons · quizzes · enroll · cart · feedback · reports · roadmaps"]
        MEDIA["media_service<br/>(NestJS)<br/>videos · projects · mascot · feed · notifications · SSE/WS"]
        PAY["payment_service<br/>(Express)<br/>PayOS orders · webhooks · transactions"]
        MAIL["mail_service<br/>OTP email (Nodemailer)"]
        AI["ai_service<br/>quiz-gen CLI / helpers"]
        INF["inference_service<br/>model inference"]
    end

    subgraph Data["Data Layer"]
        DB[("MySQL 8<br/>graduation_db<br/>shared, per-service Sequelize models")]
        REDIS[("Redis 7<br/>cache · OTP · pub/sub · feed reco")]
    end

    subgraph External["External Integrations"]
        BUNNY{{"Bunny Stream<br/>(video CDN)"}}
        CLOUD{{"Cloudinary<br/>(image CDN)"}}
        PAYOS{{"PayOS<br/>(payment gateway)"}}
        OPENAI{{"OpenAI API<br/>(quiz generation)"}}
        SMTP{{"Gmail SMTP"}}
        MODEL{{"deploy-model<br/>(mascot talking-head)"}}
    end

    WEB -->|"REST + Socket.IO + SSE<br/>Bearer accessToken"| GW

    GW -->|REST| AUTH
    GW -->|REST| USER
    GW -->|REST| COURSE
    GW -->|REST| MEDIA
    GW -->|REST| PAY
    GW -->|"WS / SSE"| MEDIA

    AUTH -->|"HTTP (send OTP)"| MAIL
    COURSE -->|"HTTP (quiz gen)"| AI

    AUTH --> DB
    USER --> DB
    COURSE --> DB
    MEDIA --> DB
    PAY --> DB

    AUTH -->|"refresh token / blacklist"| REDIS
    MAIL -->|"OTP store"| REDIS
    MEDIA -->|"feed reco cache"| REDIS
    PAY -->|"publish payment:success"| REDIS
    REDIS -.->|"subscribe payment events"| COURSE

    COURSE -->|"external-http"| OPENAI
    AI -->|"external-http"| OPENAI
    MEDIA -->|"TUS upload + webhook"| BUNNY
    MEDIA -->|"signed upload"| CLOUD
    MEDIA -->|"job submit / webhook"| MODEL
    PAY -->|"create link + webhook verify"| PAYOS
    MAIL -->|"nodemailer"| SMTP
```

## Layer responsibilities

| Layer | Package | Responsibility |
|---|---|---|
| Presentation | `frontend-nextjs` | SPA; sends Bearer access token; refresh token in HttpOnly cookie |
| Edge | `api_gateway` (Express) | CORS, rate-limit, JWT verify, RBAC via `access-policy.ts`, header injection, HTTP + WS proxy |
| Service | `auth_service` | register/login, JWT issue/refresh, Google OAuth, forgot-password OTP |
| Service | `user_service` | profile, role management, lecturer-upgrade requests, instructor follows, audit logs |
| Service | `course_service` | courses, lessons, lesson activities, quizzes (+AI), submissions, enroll, lesson progress, cart, wishlist, feedback, discussions, roadmaps, reports |
| Service | `media_service` | videos, edit projects, mascot images/overlays, highlight feed, comments/interactions/views, notifications, SSE/WebSocket |
| Service | `payment_service` (Express) | PayOS payment links, webhook verification, transactions, Redis events |
| Service | `mail_service` | OTP email via Nodemailer |
| Service | `ai_service` / `inference_service` | quiz generation helpers / model inference |
| Data | MySQL 8 `graduation_db` | single shared DB; each service registers only its models |
| Data | Redis 7 | refresh-token cache, OTP store, payment pub/sub, feed recommendation cache |
| External | Bunny / Cloudinary / PayOS / OpenAI / Gmail / deploy-model | third-party integrations |

## Notes

- No shared library: each Sequelize service re-declares the models it reads (e.g. `course.model.ts`
  exists in both `course_service` and `media_service`).
- Inter-service communication: synchronous HTTP (Axios) where needed (auth→mail), and
  asynchronous via Redis Pub/Sub (`payment:webhook`, `payment:success`, `payment:failed`).
- Socket.IO traffic is proxied straight through the gateway to `media_service`.
