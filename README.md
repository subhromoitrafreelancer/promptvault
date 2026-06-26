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
│   ├── src/main/java/com/anansu/promptvault/
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

---

## Enterprise upgrade options

The current version is a complete, deployable MVP built for speed and portability (H2, JWT, Docker). The following upgrades are available for production or enterprise deployments.

### Infrastructure and database

| Upgrade | What changes |
|---------|-------------|
| **PostgreSQL / MySQL** | Swap the H2 datasource; the codebase is already DB-agnostic (pure JPQL, Flyway migrations). Add the JDBC driver, update `application.properties`, add a new Flyway migration for any dialect-specific adjustments. |
| **Supabase** | Use Supabase's managed PostgreSQL as the datasource. Optionally adopt Supabase Auth to replace the hand-rolled JWT layer, and Supabase Storage for future file attachments. |
| **Cloud deployment** | Package for AWS ECS / GCP Cloud Run / Azure Container Apps. Externalise secrets to AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault. Add a managed load balancer in front of the nginx container. |

### Authentication and identity

| Upgrade | What changes |
|---------|-------------|
| **Keycloak** | Replace the current JWT implementation with a Keycloak OIDC token flow. Spring Security's OAuth2 Resource Server reads `ROLE_*` claims from the Keycloak token; the frontend redirects to Keycloak for login. Supports SAML federation with enterprise identity providers (AD, LDAP). |
| **Clerk** | Drop-in hosted auth with prebuilt login/register UI components. The current `AuthController` and `JwtUtil` are replaced by Clerk's JWT verification middleware. Adds social login (Google, GitHub, Microsoft) with zero extra code. |
| **Okta / Auth0** | OIDC/OAuth2 integration via Spring Security's `oauth2-resource-server` starter. Supports enterprise SSO, MFA enforcement, device trust policies, and centralised session management. |

### Security

| Upgrade | What changes |
|---------|-------------|
| **Encryption of private prompt bodies** | Private prompts encrypted at rest using AES-256-GCM with a per-user derived key (PBKDF2 or a KMS-managed key). The `Prompt.body` column stores ciphertext; decryption happens in the service layer before returning to the client. Public prompts remain plaintext. |
| **Audit logging** | Append-only `audit_events` table capturing all write operations (create, edit, delete, flag, unflag, user toggle) with actor, timestamp, and before/after diff. Admin audit trail page. |

### Features

| Feature | Description |
|---------|-------------|
| **Prompt versioning** | Every save snapshots the previous version. Users can browse version history, diff two versions side by side, and roll back to any prior state. Essential for teams doing iterative prompt engineering where accidental edits lose good work. |
| **Prompt templates with variables** | Parameterise prompts with `{{variable_name}}` placeholders. At submit time, a modal asks for values and substitutes them before sending. Turns a one-off prompt into a reusable tool — e.g. `Summarise {{document}} in {{tone}} tone for {{audience}}`. |
| **Team workspaces** | Invite team members into a named workspace. Prompts can be scoped as personal, workspace-shared, or platform-public. Workspace admins manage membership and category lists independently. Removes the current single-tenant limitation for multi-team organisations. |
| **Response quality rating** | After an AI submission, users rate the response 1–5 stars and leave an optional note. Ratings surface in the AI History view, and a per-prompt effectiveness score aggregates ratings over time. Helps users identify which prompt formulations consistently produce good outputs. |
| **Prompt chaining / pipelines** | Link prompts into an ordered sequence where the AI response from step N is automatically injected into the body of step N+1. Define reusable multi-step workflows (e.g. draft → critique → revise). Each step records its own submission history entry. |
| **Developer API access** | Issue personal API keys from the user settings page. Developers can create, submit, and retrieve prompts programmatically without the browser UI. Full OpenAPI specification included. Enables integration with CI/CD pipelines, Slack bots, or internal tooling. |
| **Bulk export and import** | Export all owned prompts (or a filtered subset) as a JSON or CSV archive. Import from the same format — or from compatible formats exported by tools like PromptLayer or LangSmith. Useful for migrating between environments or backing up prompt libraries. |

---

> **Interested in any of these upgrades?**
> Get in touch for a scoping call and quote: [subhro.moitra.freelancer@gmail.com](mailto:subhro.moitra.freelancer@gmail.com)
