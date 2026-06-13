# Deployment Guide

This branch (`deployment`) holds the deployment configuration for **TaskMaster Pro**.

The app has **four** components, all containerised and env-driven:

| Component   | Build context | Internal port | Notes |
|-------------|---------------|---------------|-------|
| MySQL 8     | managed/plugin | 3306 | database |
| Backend     | `/` (`Dockerfile`) | 8073 | Spring Boot API |
| AI sidecar  | `/ai-service` | 8090 | LangChain.js + Gemini |
| Frontend    | `/frontend` | `$PORT` (80 locally) | Angular + nginx, proxies `/api` → backend |

Everything is configured through **environment variables** — no secrets are committed.
`server.port` (backend), `PORT`/`BACKEND_URL` (frontend nginx), and `PORT` (ai-service) are all
injected at deploy time, so the same images run on docker-compose or any PaaS.

---

## Recommended PaaS: Railway (has managed MySQL)

> Render only offers managed **Postgres**, and Fly needs self-managed MySQL — so for this
> MySQL app, **Railway** is the smoothest. (Render/Fly notes at the bottom.)

### 1. Create the project & database
1. Create a new Railway project from this GitHub repo, **branch `deployment`**.
2. Add a **MySQL** database (New → Database → MySQL). Note its connection variables
   (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`).

### 2. Backend service
- New service → from repo → **Root Directory: `/`** (uses the root `Dockerfile`).
- Variables:
  ```
  PORT=8073
  SPRING_DATASOURCE_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?createDatabaseIfNotExist=true
  SPRING_DATASOURCE_USERNAME=${{MySQL.MYSQLUSER}}
  SPRING_DATASOURCE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
  SPRING_JPA_HIBERNATE_DDL_AUTO=update
  JWT_SECRET=<a long random string>
  AI_SERVICE_URL=http://ai-service.railway.internal:8090
  BREVO_API_KEY=<your Brevo key>
  BREVO_SENDER_EMAIL=<your verified Brevo sender>
  ```
  (`${{MySQL.*}}` are Railway reference variables — adjust `MySQL` to your DB service name.)

### 3. AI sidecar service
- New service → from repo → **Root Directory: `/ai-service`**.
- Variables:
  ```
  PORT=8090
  GEMINI_API_KEY=<your Gemini key>
  GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash
  ```
- Keep it **private** (no public domain needed); the backend reaches it at
  `ai-service.railway.internal:8090`. The service name must be `ai-service` to match
  `AI_SERVICE_URL` above (or change both).

### 4. Frontend service (public)
- New service → from repo → **Root Directory: `/frontend`**.
- Variables:
  ```
  BACKEND_URL=http://backend.railway.internal:8073
  ```
  (`PORT` is injected by Railway automatically; nginx listens on it.)
- Generate a public domain for this service — it's the app URL.
- The service name `backend` must match `BACKEND_URL` (or change both).

### 5. Deploy order
MySQL → backend (waits for DB) → ai-service → frontend. Railway builds each Dockerfile.
First boot runs `schema.sql` + `data.sql` (seed admin/users) automatically.

### 6. Verify
- Frontend public URL loads the login page.
- `https://<frontend-domain>/api/settings/branding` returns JSON (proves the nginx → backend proxy).
- Log in; open the AI assistant → live answers (the sidecar must have a valid `GEMINI_API_KEY`).

---

## CI/CD
`.github/workflows/ci.yml` runs on pushes/PRs to `main` and `deployment`:
- builds & unit-tests the backend, builds the frontend,
- builds all three Docker images, and **publishes them to GHCR on `main`**.

Railway redeploys automatically on every push to the connected `deployment` branch.

---

## Alternative PaaS notes
- **Render**: managed DB is Postgres only. You'd need an external MySQL (e.g. PlanetScale/Railway)
  and point `SPRING_DATASOURCE_URL` at it. Define 3 web services (Docker) in a `render.yaml`.
- **Fly.io**: `fly launch` per component (root, `/frontend`, `/ai-service`); run MySQL via a
  Fly app or external provider; use Fly private networking (`.internal`) for `BACKEND_URL` /
  `AI_SERVICE_URL`.

## Secrets
Never commit keys. Set `GEMINI_API_KEY`, `BREVO_API_KEY`, `JWT_SECRET`, and the DB credentials
as platform environment variables (or GitHub Actions secrets for CI deploy jobs).
