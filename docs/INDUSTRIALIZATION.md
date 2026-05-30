# Industrialisation (CDC Lot 4)

This document covers the testing, CI, and containerisation foundation for the project.

## Automated tests

Backend unit tests live under `src/test/java/.../service/` and use JUnit 5 + Mockito (no database):

- `AiAssistantServiceTest` — project summary, prioritisation, and delay-risk logic (8 tests)
- `AnalyticsServiceTest` — portfolio KPIs, on-time rate, velocity, workload (3 tests)

Run the fast, DB-free unit tests:

```bash
mvn -B test -Dtest='*ServiceTest'
```

> The `GpiAppApplicationTests.contextLoads` test is a full `@SpringBootTest` and needs a
> live MySQL (see `application.properties`). It is intentionally excluded from CI and the
> command above; run it locally with the database up.

Frontend build (also the frontend "test" gate in CI):

```bash
cd frontend && npm ci && npm run build
```

## Continuous Integration

`.github/workflows/ci.yml` runs on pushes to `main`/`donjunior01` and PRs to `main`:

- **backend** job — `mvn clean compile` then the `*ServiceTest` unit suite (JDK 17, Maven cache)
- **frontend** job — `npm ci` then `npm run build` (Node 22, npm cache)

Both jobs run in parallel; superseded runs on the same ref are cancelled automatically.

## Containerisation

Three services are defined in `docker-compose.yml`:

| Service  | Image / build        | Port (host) | Notes |
|----------|----------------------|-------------|-------|
| mysql    | `mysql:8.0`          | 3307        | Healthcheck-gated; data persisted in the `mysql-data` volume |
| backend  | `./Dockerfile`       | 8073        | Multi-stage Maven build → JRE; datasource overridden to reach `mysql` |
| frontend | `./frontend/Dockerfile` | 4200     | Angular build → nginx; proxies `/api` and `/ws` to `backend` |

Run the full stack:

```bash
docker compose up --build
# Frontend:  http://localhost:4200
# Swagger:   http://localhost:8073/swagger-ui.html
```

Enable the live AI assistant by passing your key through:

```bash
ANTHROPIC_API_KEY=sk-ant-... docker compose up --build
```

Notes:
- The backend container sets `SPRING_JPA_HIBERNATE_DDL_AUTO=update` so Hibernate creates the
  schema in the fresh container database; `data.sql` then seeds the MTN Cameroon sample data.
- The dev `application.properties` points at `localhost:3307`; the container overrides
  `SPRING_DATASOURCE_URL` to reach the `mysql` service on its internal `3306`.

> Status: tests and CI are verified locally (11/11 unit tests pass; YAML and Dockerfiles
> validated, both Dockerfiles lint clean via `docker build --check`). A full
> `docker compose up` has not yet been run end-to-end in this environment.
