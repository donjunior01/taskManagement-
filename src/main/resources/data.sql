-- ============================================================
-- DEPLOYMENT SEED — clean slate
-- ============================================================
-- A fresh deployment starts with EMPTY tables (schema.sql creates them) and
-- exactly ONE administrator account, used for the very first sign-in. Every
-- other record (users, projects, teams, tasks, …) is then created from inside
-- the application.
--
-- Idempotent by design: the admin row is inserted only when it is absent, so
-- application restarts (this script runs on every startup) never duplicate the
-- admin and never clobber data created in-app afterwards.
--
--   Login : admin@taskmaster.cm
--   Pass  : Password123!   (BCrypt / Spring Security, $2a$10 — change it after first login)
-- ============================================================

INSERT INTO allUsers (username, email, password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 'admin', 'admin@taskmaster.cm',
       '$2a$10$wPFj5VoKa2AzGJMToq.UseGS9Q2FlbQPjm4sHxIrhseQDQfCCR6rm',
       'Admin', 'TaskMaster', 'ADMIN', TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM allUsers WHERE email = 'admin@taskmaster.cm');
