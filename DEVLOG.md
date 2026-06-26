# PromptVault — Development Log

## Backend Implementation Steps

| Step | Area | Tasks | Status |
|------|------|-------|--------|
| B1 | Scaffold | pom.xml, main class, application.properties (dev + docker) | [x] |
| B2 | DB Migration | V1__schema.sql (DDL — 6 tables) | [x] |
| B3 | Models | 6 JPA entities: User, Category, Prompt, PolicyKeyword, FlaggedPrompt, SubmissionHistory | [x] |
| B4 | Repositories | 6 JPA repos with custom JPQL | [x] |
| B5 | Security | JwtUtil, JwtAuthFilter, UserDetailsServiceImpl, SecurityConfig | [x] |
| B6 | DTOs | Request + Response records (login, register, prompt, category, keyword, page, error) | [x] |
| B7 | Exceptions | ResourceNotFoundException, ConflictException, ForbiddenException, GlobalExceptionHandler | [x] |
| B8 | Services | PolicyService, AIService, AuthService, CategoryService, PromptService, AdminService | [x] |
| B9 | Controllers | AuthController, PromptController, CategoryController, AdminController | [x] |
| B10 | Seed Data | DataSeeder (ApplicationRunner, BCrypt-encoded passwords) | [x] |
| B11 | Docker | backend/Dockerfile (multi-stage Maven build + JRE runtime) | [x] |

## Frontend Implementation Steps

| Step | Area | Tasks | Status |
|------|------|-------|--------|
| F1 | Scaffold | nginx.conf, Dockerfile, directory structure | [x] |
| F2 | Shared JS | api.js (fetch wrapper), auth.js (JWT store/guard), nav.js + UI helpers | [x] |
| F3 | Auth pages | login.html + login.js, register.html + register.js | [x] |
| F4 | User pages | dashboard, my-prompts, prompt-form, shared, history | [x] |
| F5 | Admin pages | dashboard, users, categories, keywords, flagged | [x] |
| F6 | CSS | app.css (Bulma overrides, responsive tweaks, amber policy warning) | [x] |

## Infrastructure

| Step | Area | Tasks | Status |
|------|------|-------|--------|
| I1 | Compose | docker-compose.yml | [x] |
| I2 | Docs | README.md (setup + run instructions) | [x] |

---

## Log

### 2026-06-26
- Requirements and Architecture documents finalised
- All decisions locked (see REQUIREMENTS.md §13)
- Backend implementation complete — 47 Java files, clean compile (`mvn compile` zero errors)
- 11 backend tasks completed: scaffold → migrations → models → repos → security → DTOs → exceptions → services → controllers → seeder → Dockerfile
- Seed accounts: admin/admin123, alice/password123, bob/password123
- All frontend pages complete (F1–F6): auth, user, admin, shared JS, CSS
- Docker Compose wired (I1): nginx frontend (port 80) + Spring Boot backend (internal 8080)

### Post-launch fixes and features

**Prompt detail view**
- Added `GET /api/prompts/{id}` endpoint; widened access rule to PUBLIC or owned (403 for others' private prompts)
- New `frontend/html/prompt-detail.html` + `frontend/js/prompt-detail.js`
  - Shows full prompt body (no height cap), metadata strip, flagged warning banner
  - Edit / Submit to AI / Delete action bar rendered only for prompt owner
  - Inline AI response section shown after submit
- My Prompts and Browse Shared title columns now link to detail page

**UI link visibility fix**
- Title links in all list tables changed to `.pv-title-link` class (violet, underline on hover) — previously `color:inherit` made them invisible as links
- Browse Shared rows made fully clickable via `onclick` on `<tr>` (no action buttons in that table)
- `pv-prompt-body-full` CSS class added for uncapped body display on detail page

**Policy engine + admin management gaps (3 items)**
- Gap 1 — Admin dashboard stats: new `GET /api/admin/stats` endpoint; `AdminStatsResponse` DTO; dashboard now shows live counts for users, prompts, active flags, and keywords
- Gap 2 — Admin unflag action: new `PUT /api/admin/prompts/{id}/unflag` endpoint (sets `prompt.flagged=false`, keeps `flagged_prompts` audit rows); "Clear Flag" button in flagged list; "Reviewed" badge shown on already-cleared rows
- Gap 3 — Admin view prompt body: new `GET /api/admin/prompts/{id}` endpoint (no ownership check); inline "View/Hide" body toggle in flagged table, body cached client-side after first fetch
- `FlaggedPromptResponse` extended with `promptFlagged` field to drive Clear/Reviewed UI state
- I2 complete: README.md written
