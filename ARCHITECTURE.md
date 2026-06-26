# PromptVault — Architecture

## 1. System Overview

```
Browser
  │
  ├── GET /           → Nginx (port 80)
  │     ├── /         → serves static HTML/CSS/JS
  │     └── /api/**   → proxy_pass → Spring Boot (port 8080)
  │
  └── Spring Boot
        ├── Spring Security + JWT filter
        ├── REST controllers
        ├── Service layer (business logic + policy engine)
        ├── JPA repositories
        └── H2 file-based DB (via Flyway migrations)
```

No CORS configuration needed — Nginx presents a single origin to the browser. The backend only speaks JSON.

---

## 2. Container Architecture

```
docker-compose.yml
┌─────────────────────────────────────────────┐
│  service: frontend                          │
│  image: nginx:alpine                        │
│  ports: "80:80"                             │
│  volumes: ./frontend/html → /usr/share/...  │
│           ./frontend/nginx.conf             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  service: backend                           │
│  image: eclipse-temurin:21-jre-alpine       │
│  ports: (internal only, not exposed)        │
│  environment: SPRING_PROFILES_ACTIVE=docker │
│  volumes: h2-data → /app/data               │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  volume: h2-data (named Docker volume)      │
│  → H2 file persists across container cycles │
└─────────────────────────────────────────────┘
```

Nginx proxies all `/api/` traffic to the backend container by Docker internal DNS name (`backend:8080`). The backend port is not published to the host — only Nginx is publicly reachable.

---

## 3. Backend Architecture

### 3.1 Layer Responsibilities

```
HTTP Request
    │
    ▼
JwtAuthFilter           (OncePerRequestFilter)
    │  validates Bearer token, sets SecurityContext
    ▼
Controller              (@RestController)
    │  validates request DTO (@Valid), calls service
    ▼
Service                 (@Service, @Transactional)
    │  business logic, policy scan, orchestration
    ▼
Repository              (JpaRepository / custom JPQL)
    │
    ▼
JPA / Hibernate → H2 file DB
```

### 3.2 Security Flow

```
POST /api/auth/login
    → AuthController.login()
    → UserDetailsService.loadUserByUsername()
    → BCryptPasswordEncoder.matches()
    → JwtUtil.generateToken(username, role)
    → return { token, role }

All protected requests
    → JwtAuthFilter extracts Bearer token
    → JwtUtil.validateToken()
    → sets UsernamePasswordAuthenticationToken in SecurityContextHolder
    → SecurityConfig route rules evaluated
    → Controller proceeds
```

Token payload: `{ sub: username, role: "USER"|"ADMIN", iat, exp }`.  
No refresh token. Expiry: 24h (configurable via `jwt.expiration-ms` property).

Disabled user check: `UserDetailsServiceImpl` loads the user entity; Spring Security checks `isEnabled()` before issuing/validating, returning `403`.

### 3.3 Package Structure

```
com.promptvault
├── config
│   ├── SecurityConfig.java          # route rules, filter chain, CORS (disabled — Nginx handles)
│   └── JwtConfig.java               # @ConfigurationProperties for jwt.*
├── security
│   ├── JwtUtil.java                 # generate, validate, extract claims
│   ├── JwtAuthFilter.java           # OncePerRequestFilter
│   └── UserDetailsServiceImpl.java  # loads UserEntity, maps to Spring UserDetails
├── controller
│   ├── AuthController.java          # /api/auth/register, /api/auth/login
│   ├── PromptController.java        # /api/prompts/**
│   ├── CategoryController.java      # /api/categories/**
│   └── AdminController.java         # /api/admin/**
├── service
│   ├── AuthService.java
│   ├── PromptService.java
│   ├── CategoryService.java
│   ├── PolicyService.java           # keyword scan logic
│   ├── AIService.java               # simulated response generator
│   └── AdminService.java
├── repository
│   ├── UserRepository.java
│   ├── PromptRepository.java
│   ├── CategoryRepository.java
│   ├── PolicyKeywordRepository.java
│   ├── FlaggedPromptRepository.java
│   └── SubmissionHistoryRepository.java
├── model
│   ├── User.java
│   ├── Prompt.java
│   ├── Category.java
│   ├── PolicyKeyword.java
│   ├── FlaggedPrompt.java
│   └── SubmissionHistory.java
├── dto
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── PromptRequest.java
│   │   ├── CategoryRequest.java
│   │   └── KeywordRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── PromptResponse.java
│       ├── PromptSubmitResponse.java
│       ├── CategoryResponse.java
│       ├── UserResponse.java
│       ├── FlaggedPromptResponse.java
│       ├── SubmissionHistoryResponse.java
│       └── PageResponse.java        # generic wrapper: { content, page, size, totalPages }
└── exception
    ├── GlobalExceptionHandler.java  # @ControllerAdvice
    ├── ResourceNotFoundException.java
    ├── ConflictException.java       # category delete blocked
    └── ForbiddenException.java
```

### 3.4 Policy Service Logic

```java
// Called on prompt create, edit, submit
List<String> scan(String promptBody) {
    List<String> keywords = keywordRepo.findAll()
        .stream().map(k -> k.getKeyword().toLowerCase()).toList();
    return keywords.stream()
        .filter(k -> promptBody.toLowerCase().contains(k))
        .toList();
}

// On match:
// 1. prompt.setFlagged(true)
// 2. delete existing FlaggedPrompt rows for this prompt (re-evaluate on edit)
// 3. insert new FlaggedPrompt row per matched keyword
// 4. include matchedKeywords list in API response
```

### 3.5 Pagination Contract

All paginated endpoints accept `?page=0&size=10` query params.  
Response envelope:
```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "totalPages": 5,
  "totalElements": 47
}
```

### 3.6 Global Error Responses

```json
{ "error": "NOT_FOUND",    "message": "Prompt not found" }
{ "error": "CONFLICT",     "message": "Category has linked prompts" }
{ "error": "FORBIDDEN",    "message": "Account is disabled" }
{ "error": "UNAUTHORIZED", "message": "Invalid or expired token" }
{ "error": "VALIDATION",   "message": "title: must not be blank" }
```

---

## 4. Database Schema & Migrations

### 4.1 Flyway Script Sequence

```
db/migration/
├── V1__schema.sql       # DDL: all 6 tables
└── V2__seed.sql         # DML: admin, 2 users, 3 categories, 5 prompts, 5 keywords
```

### 4.2 Entity Relationships

```
users ──< prompts >── categories
           │
           ├──< flagged_prompts
           └──< submission_history >── users
```

- `prompts.category_id` nullable (future-proofing; not currently exposed as uncategorised)
- `flagged_prompts` rows deleted and re-inserted on each prompt save (not appended)
- `submission_history` is append-only

---

## 5. Frontend Architecture

### 5.1 Structure

```
frontend/
├── html/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── my-prompts.html
│   ├── prompt-form.html
│   ├── shared.html
│   ├── history.html
│   └── admin/
│       ├── dashboard.html
│       ├── users.html
│       ├── categories.html
│       ├── keywords.html
│       └── flagged.html
├── js/
│   ├── api.js            # centralised fetch wrapper (attaches Bearer token)
│   ├── auth.js           # login(), logout(), getToken(), getRole(), guardPage()
│   ├── dashboard.js
│   ├── my-prompts.js
│   ├── prompt-form.js
│   ├── shared.js
│   ├── history.js
│   └── admin/
│       ├── users.js
│       ├── categories.js
│       ├── keywords.js
│       └── flagged.js
├── css/
│   └── app.css           # Bulma overrides + custom variables only
├── nginx.conf
└── Dockerfile
```

### 5.2 Auth Flow (client-side)

```
login.html
  → POST /api/auth/login
  → store token + role in localStorage
  → redirect: role=ADMIN → /admin/dashboard.html
             role=USER  → /dashboard.html

Every page (in <script> at top):
  auth.guardPage(['USER'])   // or ['ADMIN'] — redirects to login.html if no valid token

logout:
  → clear localStorage
  → redirect to login.html
```

JWT is decoded client-side (base64 payload) to read `role` and `exp` — no signature verification on the client (server validates on every API call).

### 5.3 API Module Pattern

```js
// api.js
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers
    }
  });
  if (res.status === 401) { auth.logout(); return; }
  return res;
}
```

### 5.4 Page Pattern

Each HTML page:
1. Loads Bulma from CDN, then `auth.js`, `api.js`, then page-specific JS
2. Page JS calls `auth.guardPage(['USER'])` or `(['ADMIN'])` immediately
3. On DOMContentLoaded: call API, render results into the page DOM
4. Forms: prevent default submit, call API, show success/error inline

### 5.5 Policy Warning UI

On prompt create/edit form:
- On blur from the body textarea, call `POST /api/prompts/scan` (lightweight endpoint returning matched keywords)
- If keywords returned: render Bulma `notification is-warning` above the submit button
- On submit, warning persists; response will confirm `flagged: true`

### 5.6 Pagination UI

Standard Bulma pagination component. Previous / Next + page number buttons. Page state tracked in URL hash (`#page=2`) or JS variable.

---

## 6. Nginx Configuration

```nginx
server {
    listen 80;

    root /usr/share/nginx/html;
    index login.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /login.html;
    }

    # Proxy API to backend
    location /api/ {
        proxy_pass         http://backend:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
```

---

## 7. Docker Compose

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    expose:
      - "8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      JWT_SECRET: ${JWT_SECRET:-changeme-in-production}
      JWT_EXPIRATION_MS: 86400000
    volumes:
      - h2-data:/app/data

volumes:
  h2-data:
```

`application-docker.properties` sets `spring.datasource.url=jdbc:h2:file:/app/data/promptvault`.

---

## 8. Key Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| JWT stateless | Decoupled frontend can't share Spring session; stateless scales trivially |
| Nginx proxy `/api/` | Eliminates CORS entirely — browser sees one origin |
| H2 file-based | Zero external DB dependency for dev/demo; swap to Postgres in prod with no code changes |
| Flyway over Liquibase | Simpler SQL-first migrations; no XML/YAML DSL overhead |
| No refresh token | Reduces complexity; 24h TTL acceptable for this scope |
| Hard delete prompts | No audit requirement for deleted prompts; simplifies queries |
| Flagged_prompts re-insert | Ensures the audit log reflects current keyword matches, not historical ones |
| Bulma CDN | No build step; pages load Bulma directly — no npm, no bundler |

---

## 9. Build & Run (Local, No Docker)

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend (any static file server)
cd frontend
npx serve html/   # or open login.html directly in browser (CORS won't work — use Docker instead)
```

## 10. Build & Run (Docker)

```bash
docker-compose up --build
# App available at http://localhost
```
