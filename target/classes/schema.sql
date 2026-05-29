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
    `created_at` DATETIME,
    `read_at` DATETIME,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `allUsers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- Add attachment columns to comments table if not exists
ALTER TABLE `comments` ADD COLUMN IF NOT EXISTS `attachment_url` VARCHAR(500);
ALTER TABLE `comments` ADD COLUMN IF NOT EXISTS `attachment_name` VARCHAR(255);

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
