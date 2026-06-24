-- ===================================
-- DATABASE SCHEMA
-- Task Planning & Management System
-- ===================================

-- This schema uses CREATE TABLE IF NOT EXISTS to preserve data between runs

-- Create allUsers table
CREATE TABLE IF NOT EXISTS `allUsers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `user_type` VARCHAR(50) DEFAULT 'NULL',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tenants (multi-tenancy). Each user/record belongs to one organization.
CREATE TABLE IF NOT EXISTS `organizations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `plan` VARCHAR(40) NOT NULL DEFAULT 'FREE',
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_org_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Seed the default tenant (id 1) that all pre-existing single-org data belongs to.
INSERT INTO `organizations` (`id`, `name`, `slug`, `plan`, `active`, `created_at`)
SELECT 1, 'Default Organization', 'default', 'ENTERPRISE', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `id` = 1);

-- Custom RBAC: admin-defined roles (per tenant) and their granted permission keys.
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `is_system` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` BIGINT NOT NULL,
    `permission` VARCHAR(80) NOT NULL,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

-- API keys (machine credentials for the public API). Only the hash is stored.
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `key_hash` VARCHAR(80) NOT NULL,
    `key_prefix` VARCHAR(40),
    `created_by` BIGINT,
    `created_at` DATETIME,
    `last_used_at` DATETIME,
    `revoked` BOOLEAN NOT NULL DEFAULT FALSE,
    `revoked_at` DATETIME,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_api_key_hash` (`key_hash`),
    FOREIGN KEY (`created_by`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);

-- Outbound webhook subscriptions (per tenant) + the events each is subscribed to.
CREATE TABLE IF NOT EXISTS `webhook_subscriptions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT DEFAULT 1,
    `url` VARCHAR(500) NOT NULL,
    `secret` VARCHAR(120),
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME,
    `last_status` INT,
    `last_delivery_at` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `webhook_events` (
    `subscription_id` BIGINT NOT NULL,
    `event` VARCHAR(80) NOT NULL,
    FOREIGN KEY (`subscription_id`) REFERENCES `webhook_subscriptions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhook_subscriptions(organization_id);

-- Create projects table
CREATE TABLE IF NOT EXISTS `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `manager_id` BIGINT,
    `start_date` DATE,
    `end_date` DATE,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `progress` INT DEFAULT 0,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`manager_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create teams table
CREATE TABLE IF NOT EXISTS `teams` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `project_id` BIGINT,
    `manager_id` BIGINT,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`manager_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create team_members table
CREATE TABLE IF NOT EXISTS `team_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `role` VARCHAR(50) DEFAULT 'MEMBER',
    `joined_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `project_id` BIGINT,
    `assigned_to_id` BIGINT,
    `created_by_id` BIGINT,
    `priority` VARCHAR(50) DEFAULT 'MEDIUM',
    `difficulty` VARCHAR(50) DEFAULT 'MEDIUM',
    `status` VARCHAR(50) DEFAULT 'TODO',
    `progress` INT DEFAULT 0,
    `deadline` DATE,
    `reminder_type` VARCHAR(50),
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create time_logs table
CREATE TABLE IF NOT EXISTS `time_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `task_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `hours` DECIMAL(5,2) NOT NULL,
    `log_date` DATE NOT NULL,
    `description` TEXT,
    `created_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create comments table
CREATE TABLE IF NOT EXISTS `comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `task_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `attachment_url` VARCHAR(500),
    `attachment_name` VARCHAR(255),
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create deliverables table
CREATE TABLE IF NOT EXISTS `deliverables` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `task_id` BIGINT NOT NULL,
    `submitted_by_id` BIGINT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'PENDING',
    `submitted_at` DATETIME,
    `reviewed_at` DATETIME,
    `reviewed_by_id` BIGINT,
    `feedback` TEXT,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`submitted_by_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create messages table
CREATE TABLE IF NOT EXISTS `messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sender_id` BIGINT NOT NULL,
    `recipient_id` BIGINT,
    `project_id` BIGINT,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`sender_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recipient_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `activity_type` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `user_id` BIGINT,
    `entity_type` VARCHAR(255),
    `entity_id` BIGINT,
    `ip_address` VARCHAR(255),
    `created_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS `calendar_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `google_event_id` VARCHAR(255),
    `google_calendar_id` VARCHAR(255),
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `all_day` BOOLEAN DEFAULT FALSE,
    `event_type` VARCHAR(50) NOT NULL,
    `entity_id` BIGINT,
    `entity_type` VARCHAR(100),
    `user_id` BIGINT,
    `color` VARCHAR(7) DEFAULT '#4361ee',
    `location` VARCHAR(255),
    `reminder_minutes` INT DEFAULT 0,
    `is_synced` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT,
    `type` VARCHAR(50) NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `reference_id` BIGINT,
    `reference_type` VARCHAR(100),
    `i18n_key` VARCHAR(120),
    `i18n_params` TEXT,
    `created_at` DATETIME,
    `read_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add localisation columns to notifications for existing databases.
-- MySQL has no ADD COLUMN IF NOT EXISTS; spring.sql.init.continue-on-error=true makes the
-- duplicate-column error on subsequent startups harmless.
ALTER TABLE `notifications` ADD COLUMN `i18n_key` VARCHAR(120);
ALTER TABLE `notifications` ADD COLUMN `i18n_params` TEXT;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` VARCHAR(50) DEFAULT 'MEDIUM',
    `status` VARCHAR(50) DEFAULT 'OPEN',
    `assigned_to_id` BIGINT,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    `resolved_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add subject column to messages table if not exists
-- ALTER TABLE `messages` ADD COLUMN IF NOT EXISTS `subject` VARCHAR(255);

-- Add attachment columns to comments table.
-- MySQL has no ADD COLUMN IF NOT EXISTS; spring.sql.init.continue-on-error=true makes the
-- duplicate-column error on subsequent startups harmless.
ALTER TABLE `comments` ADD COLUMN `attachment_url` VARCHAR(500);
ALTER TABLE `comments` ADD COLUMN `attachment_name` VARCHAR(255);

-- Add updated_at column to comments table (Comment entity maps updatedAt; a database
-- created before this column existed would 500 on every insert/select).
-- MySQL has no ADD COLUMN IF NOT EXISTS; spring.sql.init.continue-on-error=true makes the
-- duplicate-column error on subsequent startups harmless.
ALTER TABLE `comments` ADD COLUMN `updated_at` DATETIME;

-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_log_date ON time_logs(log_date);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255),
    `email` VARCHAR(255),
    `status` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(255),
    `user_agent` TEXT,
    `user_id` BIGINT,
    `attempted_at` DATETIME NOT NULL,
    `reason` VARCHAR(255),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_status ON login_attempts(status);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);

-- Create password_reset_requests table
CREATE TABLE IF NOT EXISTS `password_reset_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `reason` TEXT,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `user_id` BIGINT,
    `processed_by_id` BIGINT,
    `requested_at` DATETIME,
    `processed_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`processed_by_id`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_requests(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `email_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `push_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `task_deadline_reminders` BOOLEAN NOT NULL DEFAULT TRUE,
    `task_assignment_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `project_update_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `comment_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `message_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
    `deadline_reminder_hours` INT NOT NULL DEFAULT 24,
    `created_at` DATETIME,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Two-factor authentication columns on allUsers (CDC Lot 4).
-- MySQL has no ADD COLUMN IF NOT EXISTS; spring.sql.init.continue-on-error=true makes the
-- duplicate-column error on subsequent startups harmless.
ALTER TABLE `allUsers` ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `allUsers` ADD COLUMN `two_factor_secret` VARCHAR(255);
ALTER TABLE `allUsers` ADD COLUMN `two_factor_recovery_codes` TEXT;
ALTER TABLE `allUsers` ADD COLUMN `password_changed_at` DATETIME;
-- Backfill a baseline so the rotation policy applies to existing accounts from their creation date.
UPDATE `allUsers` SET `password_changed_at` = `created_at` WHERE `password_changed_at` IS NULL;

-- Multi-tenancy: attach every user to an organization (existing users -> the default tenant).
-- DEFAULT 1 ensures seed/system inserts never produce NULL-org rows (which a tenant filter would hide).
ALTER TABLE `allUsers` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `allUsers` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `allUsers` ADD CONSTRAINT `fk_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL;

-- Custom RBAC: optional per-user custom role (overrides base-role default permissions when set).
ALTER TABLE `allUsers` ADD COLUMN `custom_role_id` BIGINT;
ALTER TABLE `allUsers` ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`custom_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL;

-- Multi-tenancy: stamp the core domain tables with their tenant (existing rows -> default tenant id 1).
ALTER TABLE `projects` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `projects` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `tasks` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `tasks` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `teams` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `teams` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `deliverables` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `deliverables` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `support_tickets` ADD COLUMN `organization_id` BIGINT DEFAULT 1;
UPDATE `support_tickets` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_org ON deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);

-- Create task_checklist_items table (sub-tasks / checklists)
CREATE TABLE IF NOT EXISTS `task_checklist_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `task_id` BIGINT NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System settings (admin configuration: General + Security). Single-row table (id = 1).
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` BIGINT NOT NULL,
    `app_name` VARCHAR(120) NOT NULL DEFAULT 'TaskMaster Pro',
    `default_language` VARCHAR(40) NOT NULL DEFAULT 'Français',
    `timezone` VARCHAR(60) NOT NULL DEFAULT 'Europe/Paris (UTC+1)',
    `jwt_validity_minutes` INT NOT NULL DEFAULT 1440,
    `max_login_attempts` INT NOT NULL DEFAULT 5,
    `lockout_duration_minutes` INT NOT NULL DEFAULT 15,
    `password_min_length` INT NOT NULL DEFAULT 12,
    `password_require_uppercase` BOOLEAN NOT NULL DEFAULT TRUE,
    `password_require_digit` BOOLEAN NOT NULL DEFAULT TRUE,
    `password_require_special` BOOLEAN NOT NULL DEFAULT TRUE,
    `password_expiry_days` INT NOT NULL DEFAULT 90,
    `two_factor_required_admins` BOOLEAN NOT NULL DEFAULT FALSE,
    `two_factor_required_all` BOOLEAN NOT NULL DEFAULT FALSE,
    `maintenance_mode` BOOLEAN NOT NULL DEFAULT FALSE,
    `smtp_host` VARCHAR(120) DEFAULT 'smtp.gpi.app',
    `smtp_port` INT DEFAULT 587,
    `smtp_username` VARCHAR(120) DEFAULT 'noreply@gpi.app',
    `smtp_password` VARCHAR(255) DEFAULT '',
    `smtp_sender` VARCHAR(160) DEFAULT 'TaskMaster Pro <noreply@gpi.app>',
    `notify_on_registration` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_task_assigned` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_on_deliverable_submitted` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_suspicious_login` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_project_overdue` BOOLEAN NOT NULL DEFAULT TRUE,
    `backup_retention_days` INT NOT NULL DEFAULT 30,
    `updated_at` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `system_settings` (`id`) VALUES (1) ON DUPLICATE KEY UPDATE `id` = `id`;

-- Additive columns for system_settings rows created before the Notifications/Backup tabs
-- existed (duplicate-column errors are harmless: spring.sql.init.continue-on-error=true).
ALTER TABLE `system_settings` ADD COLUMN `smtp_host` VARCHAR(120) DEFAULT 'smtp.gpi.app';
ALTER TABLE `system_settings` ADD COLUMN `smtp_port` INT DEFAULT 587;
ALTER TABLE `system_settings` ADD COLUMN `smtp_username` VARCHAR(120) DEFAULT 'noreply@gpi.app';
ALTER TABLE `system_settings` ADD COLUMN `smtp_password` VARCHAR(255) DEFAULT '';
ALTER TABLE `system_settings` ADD COLUMN `smtp_sender` VARCHAR(160) DEFAULT 'TaskMaster Pro <noreply@gpi.app>';
ALTER TABLE `system_settings` ADD COLUMN `notify_on_registration` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `system_settings` ADD COLUMN `notify_on_task_assigned` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `system_settings` ADD COLUMN `notify_on_deliverable_submitted` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `system_settings` ADD COLUMN `notify_on_suspicious_login` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `system_settings` ADD COLUMN `notify_on_project_overdue` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `system_settings` ADD COLUMN `backup_retention_days` INT NOT NULL DEFAULT 30;
ALTER TABLE `system_settings` ADD COLUMN `two_factor_required_all` BOOLEAN NOT NULL DEFAULT FALSE;

-- Project creator (per-admin project ownership & traceability). Harmless duplicate-column error on re-run.
ALTER TABLE `projects` ADD COLUMN `created_by` BIGINT;

-- Enforce referential integrity on the creator column so a deleted user can't leave a dangling
-- reference (which would 500 when the project is loaded). First null out any pre-existing orphans,
-- then add the FK. Both statements are idempotent under spring.sql.init.continue-on-error=true.
UPDATE `projects` SET `created_by` = NULL
    WHERE `created_by` IS NOT NULL AND `created_by` NOT IN (SELECT `id` FROM `allUsers`);
ALTER TABLE `projects` ADD CONSTRAINT `fk_projects_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `allUsers`(`id`) ON DELETE SET NULL;

-- Archive flag for projects (admin "archive" action). Harmless duplicate-column error on re-run.
ALTER TABLE `projects` ADD COLUMN `archived` BOOLEAN NOT NULL DEFAULT FALSE;

-- Blocked IP addresses (admin security console). Logins from these IPs are refused.
CREATE TABLE IF NOT EXISTS `blocked_ips` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ip_address` VARCHAR(64) NOT NULL,
    `reason` VARCHAR(255),
    `blocked_at` DATETIME,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_blocked_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Server-side sessions for revocable JWTs (active-devices list, "sign out everywhere", admin force-logout).
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` VARCHAR(64) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `device` VARCHAR(400),
    `ip_address` VARCHAR(64),
    `created_at` DATETIME,
    `last_seen_at` DATETIME,
    `revoked` BOOLEAN NOT NULL DEFAULT FALSE,
    `revoked_at` DATETIME,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_session_id` (`session_id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Link per-recipient copies of a distributed calendar event (PM events sent to project members).
ALTER TABLE `calendar_events` ADD COLUMN `series_id` VARCHAR(64);

ALTER TABLE `system_settings` ADD COLUMN `max_file_upload_mb` INT NOT NULL DEFAULT 100;

-- Branding: app logo (data-URI or URL) + PDF header/footer colours and footer text.
ALTER TABLE `system_settings` ADD COLUMN `logo_url` LONGTEXT;
ALTER TABLE `system_settings` ADD COLUMN `pdf_header_color` VARCHAR(20) DEFAULT '#1e2540';
ALTER TABLE `system_settings` ADD COLUMN `pdf_footer_color` VARCHAR(20) DEFAULT '#2563eb';
ALTER TABLE `system_settings` ADD COLUMN `pdf_footer_text` VARCHAR(255) DEFAULT 'Document confidentiel — généré automatiquement';

-- Message attachments (group chat / messaging). Duplicate-column errors harmless on re-run.
ALTER TABLE `messages` ADD COLUMN `attachment_url` VARCHAR(500);
ALTER TABLE `messages` ADD COLUMN `attachment_name` VARCHAR(255);
ALTER TABLE `messages` ADD COLUMN `attachment_type` VARCHAR(30);
ALTER TABLE `messages` ADD COLUMN `attachment_size` VARCHAR(40);
