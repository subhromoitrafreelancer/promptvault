# PromptVault — Consolidated Requirements

## 1. Overview

PromptVault is a secure prompt management web application. Users store, organise, and submit prompts to a simulated AI assistant. A policy engine scans prompts for sensitive keywords and warns users (or flags prompts for admin review). Admins manage the platform — users, categories, keywords, and flagged content.

The system is composed of two independently deployable units: a headless REST API backend (Spring Boot) and a static frontend (HTML + Bulma CSS + plain JS/jQuery), served by Nginx. Both are containerised via Docker.

---

## 2. Tech Stack

| Layer            | Technology                                              |
|------------------|---------------------------------------------------------|
| Backend language | Java 21                                                 |
| Backend framework| Spring Boot 3.x                                         |
| API style        | RESTful JSON — no server-side rendering                 |
| Security         | Spring Security + JWT (stateless)                       |
| ORM              | Spring Data JPA / Hibernate — DB agnostic               |
| Database (dev)   | H2 file-based (embedded, persists across restarts)      |
| DB migrations    | Flyway (includes seed data scripts)                     |
| Build tool       | Maven                                                   |
| Frontend         | Static HTML pages — Bulma CSS, plain JS, jQuery         |
| Frontend server  | Nginx (Docker container)                                |
| Containerisation | Docker + Docker Compose                                 |

> **DB agnosticism**: All queries via JPA/JPQL — no native SQL dialect. Swapping to PostgreSQL or MySQL requires only a driver + `application.properties` change.

---

## 3. Roles

| Role  | Description                              |
|-------|------------------------------------------|
| ADMIN | Platform manager — single seeded account |
| USER  | Self-registered, manages own prompts     |

---

## 4. Data Model

### 4.1 users
| Field      | Type      | Notes                   |
|------------|-----------|-------------------------|
| id         | BIGINT PK | auto-increment          |
| username   | VARCHAR   | unique, not null        |
| email      | VARCHAR   | unique, not null        |
| password   | VARCHAR   | bcrypt hashed           |
| role       | VARCHAR   | `ADMIN` or `USER`       |
| enabled    | BOOLEAN   | admin can toggle        |
| created_at | TIMESTAMP |                         |

### 4.2 categories
| Field       | Type      | Notes            |
|-------------|-----------|------------------|
| id          | BIGINT PK |                  |
| name        | VARCHAR   | unique, not null |
| description | TEXT      |                  |
| created_at  | TIMESTAMP |                  |

### 4.3 prompts
| Field       | Type      | Notes                                  |
|-------------|-----------|----------------------------------------|
| id          | BIGINT PK |                                        |
| title       | VARCHAR   | not null                               |
| body        | TEXT      | the prompt text                        |
| category_id | BIGINT FK | → categories; nullable (reassign safe) |
| user_id     | BIGINT FK | → users; not null                      |
| visibility  | VARCHAR   | `PUBLIC` or `PRIVATE`                  |
| flagged     | BOOLEAN   | true when policy keyword detected      |
| created_at  | TIMESTAMP |                                        |
| updated_at  | TIMESTAMP |                                        |

### 4.4 policy_keywords
| Field      | Type      | Notes                        |
|------------|-----------|------------------------------|
| id         | BIGINT PK |                              |
| keyword    | VARCHAR   | unique, not null             |
| created_at | TIMESTAMP |                              |

### 4.5 flagged_prompts (audit log)
| Field      | Type      | Notes                             |
|------------|-----------|-----------------------------------|
| id         | BIGINT PK |                                   |
| prompt_id  | BIGINT FK | → prompts                         |
| keyword    | VARCHAR   | which keyword triggered the flag  |
| flagged_at | TIMESTAMP |                                   |

### 4.6 submission_history
| Field        | Type      | Notes                             |
|--------------|-----------|-----------------------------------|
| id           | BIGINT PK |                                   |
| prompt_id    | BIGINT FK | → prompts                         |
| user_id      | BIGINT FK | → users                           |
| ai_response  | TEXT      | simulated fixed/template string   |
| submitted_at | TIMESTAMP |                                   |

---

## 5. Seed Data (via Flyway)

| Entity          | Count | Details                                                         |
|-----------------|-------|-----------------------------------------------------------------|
| Admin           | 1     | username: `admin`, email: `admin@promptvault.com`               |
| Users           | 2     | `alice`, `bob`                                                  |
| Categories      | 3     | Coding, Creative Writing, Research                              |
| Prompts         | 5     | Mix of PUBLIC/PRIVATE, at least one with a flagged keyword      |
| Policy Keywords | 5     | `password`, `api key`, `secret`, `private key`, `confidential`  |

---

## 6. REST API Contract

All endpoints return JSON. Auth endpoints are public; all others require `Authorization: Bearer <token>` header.

### 6.1 Auth
| Method | Path              | Body                          | Response                  |
|--------|-------------------|-------------------------------|---------------------------|
| POST   | `/api/auth/register` | `{username, email, password}` | `{token, role}`        |
| POST   | `/api/auth/login`    | `{username, password}`        | `{token, role}`        |

### 6.2 Prompts (USER)
| Method | Path                         | Notes                                      |
|--------|------------------------------|--------------------------------------------|
| GET    | `/api/prompts/mine`          | Paginated list of own prompts              |
| POST   | `/api/prompts`               | Create; triggers policy scan               |
| PUT    | `/api/prompts/{id}`          | Edit own; re-runs policy scan              |
| DELETE | `/api/prompts/{id}`          | Delete own                                 |
| GET    | `/api/prompts/shared`        | Paginated PUBLIC prompts from all users    |
| POST   | `/api/prompts/{id}/submit`   | Submit to AI; returns AI response          |
| GET    | `/api/prompts/history`       | Paginated own submission history           |

### 6.3 Categories
| Method | Path                    | Notes                          |
|--------|-------------------------|--------------------------------|
| GET    | `/api/categories`       | All categories (USER + ADMIN)  |
| POST   | `/api/categories`       | ADMIN only                     |
| PUT    | `/api/categories/{id}`  | ADMIN only                     |
| DELETE | `/api/categories/{id}`  | ADMIN only; blocked if prompts linked |

### 6.4 Admin
| Method | Path                              | Notes                          |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/admin/users`                | Paginated user list            |
| PUT    | `/api/admin/users/{id}/toggle`    | Enable/disable account         |
| GET    | `/api/admin/keywords`             | All policy keywords            |
| POST   | `/api/admin/keywords`             | Add keyword                    |
| PUT    | `/api/admin/keywords/{id}`        | Edit keyword                   |
| DELETE | `/api/admin/keywords/{id}`        | Delete keyword                 |
| GET    | `/api/admin/flagged`              | Paginated flagged prompts      |

---

## 7. Feature Specification

### 7.1 Authentication

- JWT issued on login/register; stored in `localStorage` on the frontend
- Token carries `sub` (username), `role`, `exp`
- Disabled users receive HTTP 403 on login attempt
- No refresh token — session ends when token expires (configurable TTL, default 24h)
- Password reset: **out of scope**

### 7.2 Admin Features

| Feature                   | Detail                                                         |
|---------------------------|----------------------------------------------------------------|
| View all users            | Table: username, email, role, status, created date — paginated |
| Enable / disable account  | Toggle; disabled token is rejected on next request             |
| Manage categories         | CRUD; delete blocked with `409 Conflict` if prompts exist      |
| Manage policy keywords    | CRUD                                                           |
| View flagged prompts      | Table: title, owner, matched keyword, flagged date — paginated |

### 7.3 User Features

| Feature               | Detail                                                                       |
|-----------------------|------------------------------------------------------------------------------|
| Create prompt         | title, body, category (dropdown), visibility (PUBLIC/PRIVATE)                |
| View own prompts      | Paginated; shows flagged badge, category, visibility                         |
| Edit own prompt       | Any field; policy scan re-runs on save                                       |
| Delete own prompt     | Hard delete                                                                  |
| Browse shared         | All PUBLIC prompts, read-only, paginated                                     |
| Submit to AI          | POST to submit endpoint; shows simulated response inline                     |
| Submission history    | Paginated list: prompt title, AI response, timestamp                         |
| Policy warning        | If prompt body contains a keyword: show warning banner above form/submit; submission not blocked; prompt marked flagged |

### 7.4 Simulated AI Assistant

- No external API call
- Response template: `"[PromptVault AI] Processed: '{title}'. Your prompt has been analysed. No further action required."`
- Full prompt text and response persisted in `submission_history`

---

## 8. Policy Keyword Scan — Behaviour

1. Triggered on: **create**, **edit**, **submit**
2. Case-insensitive substring match against all `policy_keywords` rows
3. On match:
   - `prompt.flagged = true`
   - Upsert row in `flagged_prompts` (one row per keyword per prompt; re-flag on edit)
   - API response includes `"flagged": true` and `"matchedKeywords": [...]`
   - Frontend shows a non-dismissible warning banner until the user edits the prompt
4. Flagged state fully re-evaluated on each save (cleared if no keywords remain)

---

## 9. Frontend Pages

All pages are standalone HTML files. Auth state managed via JWT in `localStorage`. Axios or `$.ajax` for API calls.

### User-facing
| Page                 | File                    |
|----------------------|-------------------------|
| Login                | `login.html`            |
| Register             | `register.html`         |
| Dashboard            | `dashboard.html`        |
| My Prompts           | `my-prompts.html`       |
| Create / Edit Prompt | `prompt-form.html`      |
| Browse Shared        | `shared.html`           |
| Submission History   | `history.html`          |

### Admin-facing
| Page               | File                      |
|--------------------|---------------------------|
| Admin Dashboard    | `admin/dashboard.html`    |
| User Management    | `admin/users.html`        |
| Category Management| `admin/categories.html`   |
| Keyword Management | `admin/keywords.html`     |
| Flagged Prompts    | `admin/flagged.html`      |

---

## 10. Docker Architecture

```
docker-compose.yml
├── frontend   (nginx:alpine)
│     - serves /usr/share/nginx/html (static files)
│     - proxies /api/** → backend:8080
├── backend    (eclipse-temurin:21-jre)
│     - Spring Boot fat JAR
│     - H2 file DB persisted via Docker volume
```

Nginx reverse-proxies `/api/` to the backend — no CORS headers needed on the backend since both are served from the same origin (Nginx).

---

## 11. Project Structure

```
promptvault/
├── backend/
│   ├── src/main/java/com/promptvault/
│   │   ├── config/          # SecurityConfig, JwtConfig, CorsConfig
│   │   ├── controller/      # AuthController, PromptController, CategoryController, AdminController
│   │   ├── service/         # UserService, PromptService, PolicyService, AIService, CategoryService
│   │   ├── repository/      # JPA repositories
│   │   ├── model/           # JPA entities
│   │   ├── dto/             # Request/Response DTOs
│   │   └── security/        # JwtFilter, JwtUtil, UserDetailsServiceImpl
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/    # V1__schema.sql, V2__seed.sql
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── html/                # all .html pages
│   ├── css/                 # custom overrides (bulma loaded via CDN)
│   ├── js/
│   │   ├── api.js           # axios/jQuery wrapper for all API calls
│   │   ├── auth.js          # JWT store/retrieve/decode
│   │   └── [page].js        # page-specific logic
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 12. Non-Functional Requirements

| Concern         | Approach                                                          |
|-----------------|-------------------------------------------------------------------|
| Responsiveness  | Bulma grid + columns; mobile-first breakpoints                    |
| Security        | Passwords bcrypt; JWT signed HS256; no sensitive data in tokens   |
| DB portability  | JPA only — no native queries; Flyway migrations use standard SQL  |
| Pagination      | 10 records per page; Spring `Pageable`; frontend renders prev/next|
| Error handling  | Global `@ControllerAdvice`; consistent `{error, message}` JSON    |

---

## 13. Decisions Locked

| # | Decision                                                                                   |
|---|--------------------------------------------------------------------------------------------|
| 1 | **Frontend**: Static HTML + Bulma CSS + plain JS + jQuery — served by Nginx                |
| 2 | **Backend**: Headless Spring Boot REST API — no Thymeleaf                                  |
| 3 | **Auth**: JWT stateless; stored in `localStorage`; 24h TTL                                 |
| 4 | **Database**: H2 file-based for dev; DB-agnostic JPA — no MySQL-specific code              |
| 5 | **Migrations**: Flyway — schema + seed in versioned scripts                                 |
| 6 | **Build**: Maven, JDK 21                                                                    |
| 7 | **Docker**: 2 containers (nginx + Spring Boot); Nginx proxies `/api/` to backend           |
| 8 | **Flag on submit**: Warn and allow — never blocked                                          |
| 9 | **Shared prompts**: All PUBLIC prompts platform-wide                                        |
| 10| **Category delete**: HTTP 409 blocked if linked prompts exist                              |
| 11| **History**: Users see only their own; no admin history view                               |
| 12| **Admin prompt access**: Flagged prompts only                                              |
| 13| **Password reset**: Out of scope                                                            |
| 14| **Pagination**: 10/page on all list views                                                  |
