# End-to-end smoke tests (Playwright)

A starter E2E scaffold for the critical flows (login, routing, auth rejection). It is intentionally
**not** wired into `package.json` or CI yet, because it needs the full stack running and a browser
download — enabling it must be a deliberate step so `npm ci` and the pipeline stay green until then.

## Enable & run
```bash
cd frontend
npm i -D @playwright/test        # add the dependency
npx playwright install --with-deps chromium

# In separate terminals, with a seeded DB (data.sql loaded):
#   backend  → ./mvnw spring-boot:run         (http://localhost:8073)
#   frontend → npm start                      (http://localhost:4200, proxies /api)

npx playwright test -c e2e/playwright.config.ts
```

Override the target with `E2E_BASE_URL` (e.g. a deployed environment).

## Notes
- Selectors in `smoke.spec.ts` use roles/placeholders so they tolerate style changes; adjust them
  to your DOM if a locator misses.
- Seeded accounts (password `password123`): `admin@mtncameroon.cm` (ADMIN),
  `tchinda.pm@mtncameroon.cm` (PM), `mbarga@mtncameroon.cm` (USER).
- Once green locally, add a CI job that boots the stack (or targets a deploy preview) and runs
  `npx playwright test`.
