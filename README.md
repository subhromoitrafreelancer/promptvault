# PromptVault

A secure prompt management platform. Users create, organise, and submit prompts to an AI. A policy engine scans every prompt for sensitive keywords and flags violations for admin review. Admins manage users, categories, keywords, and flagged content.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.3.5, Spring Security (JWT), Spring Data JPA |
| Database | H2 file-based (DB-agnostic JPA — no native SQL) |
| Migrations | Flyway (`V1__schema.sql`) + `DataSeeder` (ApplicationRunner) |
| Frontend | Nginx, Bulma 0.9.4 (CDN), plain JS + jQuery |
| Containerisation | Docker Compose — 2 services: nginx (port 80) + Spring Boot (internal 8080) |

## Prerequisites

- Docker and Docker Compose
- Ports 80 free on the host

## Run

```bash
git clone <repo>
cd promptvault
docker compose up --build
```

Open http://localhost in your browser.

To stop:

```bash
docker compose down
```

The H2 database is stored in the `h2-data` named Docker volume and persists across restarts. To wipe all data and re-seed from scratch:

```bash
docker compose down -v   # removes the volume
docker compose up --build
```

## Seed accounts

These are created automatically on first run when the database is empty.

| Username | Password | Role | Notes |
|----------|----------|------|-------|
| `admin` | `admin123` | Admin | Full platform management |
| `alice` | `password123` | User | 3 public prompts seeded |
| `bob` | `password123` | User | 1 private flagged prompt seeded |

### Logging in as admin

1. Go to http://localhost
2. Enter username `admin` and password `admin123`
3. You are redirected to the Admin Dashboard at `/admin/dashboard.html`

The admin role has access to:
- **Dashboard** — live counts of users, prompts, active flags, and policy keywords
- **Users** — enable or disable user accounts
- **Categories** — add, edit, delete prompt categories
- **Policy Keywords** — manage the list of sensitive keywords the policy engine scans for
- **Flagged Prompts** — review violations, view full prompt body inline, clear flags

Admin accounts cannot create or submit prompts (the USER role is separate). To test user features, log in as `alice` or `bob`.

## Policy engine

Every prompt body is scanned on create, edit, and submit against the keyword list. Default seeded keywords: `password`, `api key`, `secret`, `private key`, `confidential`.

- **User experience**: live warning shown while typing in the prompt form (600 ms debounce); warning also shown on save and after AI submit. The prompt is saved regardless — flag-and-allow, never blocked.
- **Admin experience**: flagged prompts appear in the Flagged Prompts page with the matched keyword. Admin can view the full body inline and clear the flag (marks as reviewed). Clearing keeps the audit row but removes the active flag. If the user later edits and saves the prompt and it still contains keywords, it will be re-flagged automatically.

## Development (without Docker)

**Backend:**

```bash
cd backend
mvn spring-boot:run
```

Runs on http://localhost:8080. H2 console at http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:file:./data/promptvault`).

**Frontend:**

The frontend is static HTML/JS/CSS. Open files directly from `frontend/html/` in a browser, or serve them with any static file server. API calls are proxied through Nginx in Docker; for local dev without Docker you need to configure CORS on the backend or run a local proxy.

## Project structure

```
promptvault/
├── backend/
│   ├── src/main/java/com/promptvault/
│   │   ├── config/          SecurityConfig, DataSeeder
│   │   ├── controller/      AuthController, PromptController, CategoryController, AdminController
│   │   ├── dto/             Request + Response records
│   │   ├── exception/       GlobalExceptionHandler + typed exceptions
│   │   ├── model/           6 JPA entities
│   │   ├── repository/      6 Spring Data JPA repositories
│   │   ├── security/        JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│   │   └── service/         PolicyService, AIService, AuthService, CategoryService, PromptService, AdminService
│   └── src/main/resources/
│       ├── application.properties
│       ├── application-docker.properties
│       └── db/migration/V1__schema.sql
├── frontend/
│   ├── html/                Static pages (login, register, dashboard, my-prompts, shared, history, prompt-form, prompt-detail, admin/*)
│   ├── js/                  auth.js, api.js, nav.js, page scripts, admin/*.js
│   ├── css/app.css
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── REQUIREMENTS.md
├── ARCHITECTURE.md
└── DEVLOG.md
```
