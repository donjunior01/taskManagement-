# Load testing (k6)

Baseline performance/load checks with [k6](https://k6.io).

## Run
1. Install k6 (`winget install k6` / `brew install k6` / see k6.io).
2. Start the stack with a seeded DB — backend on `:8073`, `data.sql` loaded.
3. Run:
   ```bash
   k6 run load-test/k6-smoke.js
   ```
   Override the target/credentials with env vars:
   ```bash
   BASE_URL=https://staging.example.com EMAIL=admin@... PASSWORD=... k6 run load-test/k6-smoke.js
   ```

## Thresholds (fail the run if breached)
- `http_req_failed` < 1%
- `http_req_duration` p95 < 800 ms

Tune the `stages`/target VUs to your expected concurrency. Use this to catch regressions after the
Phase-3 DB index + connection-pool changes and to validate SLOs before a release.
