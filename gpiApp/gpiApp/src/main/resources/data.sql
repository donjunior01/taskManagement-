# -- Database initialization script with test data for Task Management System
#
# -- Insert Task Categories
# INSERT INTO task_categories (category_id, category_name, description, color_code, is_active) VALUES
# (1, 'Development', 'Software development tasks', '#007bff', true),
# (2, 'Design', 'UI/UX design tasks', '#28a745', true),
# (3, 'Testing', 'Quality assurance tasks', '#ffc107', true),
# (4, 'Documentation', 'Documentation tasks', '#17a2b8', true),
# (5, 'Meeting', 'Meeting and coordination tasks', '#6f42c1', true);
#
# -- Insert Task Priorities
# INSERT INTO task_priorities (priority_id, priority_name, priority_level, color_code, is_active) VALUES
# (1, 'Low', 1, '#6c757d', true),
# (2, 'Medium', 2, '#ffc107', true),
# (3, 'High', 3, '#fd7e14', true),
# (4, 'Critical', 4, '#dc3545', true);
#
# -- Insert Notification Types
# INSERT INTO notification_types (type_id, type_name, description, is_active, default_settings) VALUES
# (1, 'TASK_ASSIGNED', 'Notification when a task is assigned', true, '{"email": true, "push": true, "sms": false}'),
# (2, 'TASK_COMPLETED', 'Notification when a task is completed', true, '{"email": true, "push": true, "sms": false}'),
# (3, 'TASK_OVERDUE', 'Notification for overdue tasks', true, '{"email": true, "push": true, "sms": true}'),
# (4, 'WEEKLY_PLANNING_DUE', 'Reminder for weekly planning submission', true, '{"email": true, "push": true, "sms": false}');
#
# -- Insert System Settings
# INSERT INTO system_settings (setting_id, setting_key, setting_value, data_type, description, is_encrypted, updated_at) VALUES
# (1, 'MAX_TASKS_PER_DAY', '8', 'INTEGER', 'Maximum number of tasks per day for planning', false, NOW()),
# (2, 'WEEKLY_PLANNING_DEADLINE', 'FRIDAY_17_00', 'STRING', 'Weekly planning submission deadline', false, NOW()),
# (3, 'AUTO_APPROVE_TASKS', 'false', 'BOOLEAN', 'Auto-approve completed tasks', false, NOW()),
# (4, 'NOTIFICATION_RETENTION_DAYS', '30', 'INTEGER', 'Days to retain notifications', false, NOW());
#
# -- Insert Users (Super Admin, Managers, Employees)
# INSERT INTO allUsers (user_id, email, password_hash, first_name, last_name, phone, profile_picture_url, user_role, user_post, is_active, email_verified_at, last_login_at, created_at, updated_at) VALUES
# -- Super Admin
# (1, 'admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Admin', '+1234567890', 'https://example.com/profiles/admin.jpg', 'SUPER_ADMIN', 'OPERATIONS_MANAGER', true, NOW(), NOW(), NOW(), NOW()
# ),
#
# -- Managers
# (2, 'manager1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Manager', '+1234567891', 'https://example.com/profiles/manager1.jpg', 'MANAGER', 'PROJECT_MANAGER', true, NOW(), NOW(), NOW(), NOW()
# ),
# (3, 'manager2@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael', 'TeamLead', '+1234567892', 'https://example.com/profiles/manager2.jpg', 'MANAGER', 'TEAM_LEAD', true, NOW(), NOW(), NOW(), NOW()),
#
# -- Employees
# (4, 'developer1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice', 'Developer', '+1234567893', 'https://example.com/profiles/dev1.jpg', 'EMPLOYEE', 'DEVELOPER', true, NOW(), NOW(), NOW(), NOW()
# ),
# (5, 'developer2@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob', 'Coder', '+1234567894', 'https://example.com/profiles/dev2.jpg', 'EMPLOYEE', 'DEVELOPER', true, NOW(), NOW(), NOW(), NOW()
# ),
# (6, 'designer1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Designer', '+1234567895', 'https://example.com/profiles/designer1.jpg', 'EMPLOYEE', 'UI_UX_DESIGNER', true, NOW(), NOW(), NOW(), NOW()
# ),
# (7, 'tester1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Tester', '+1234567896', 'https://example.com/profiles/tester1.jpg', 'EMPLOYEE', 'QA_ENGINEER', true, NOW(), NOW(), NOW(), NOW()
# );
#
# -- Insert Teams
# INSERT INTO teams (team_id, team_name, description, team_leader_id, is_active, created_at, updated_at) VALUES
# (1, 'Development Team A', 'Main development team for web applications', 2, true, NOW(), NOW()),
# (2, 'Design Team', 'UI/UX design and creative team', 3, true, NOW(), NOW());
#
# -- Insert User Teams
# INSERT INTO user_teams (user_team_id, user_id, team_id, joined_at, left_at, is_active) VALUES
# -- Development Team A members
# (1, 2, 1, NOW(), NULL, true),
# (2, 4, 1, NOW(), NULL, true),
# (3, 5, 1, NOW(), NULL, true),
# (4, 7, 1, NOW(), NULL, true),
#
# -- Design Team members
# (5, 3, 2, NOW(), NULL, true),
# (6, 6, 2, NOW(), NULL, true);
#
# -- Insert Projects
# INSERT INTO projects (project_id, project_name, description, team_id, status, start_date, end_date, created_at, updated_at) VALUES
# (1, 'E-Commerce Platform', 'Modern e-commerce platform with React frontend and Spring Boot backend', 1, 'ACTIVE', '2024-01-01', '2024-06-30', NOW(), NOW()),
# (2, 'Mobile App Redesign', 'Redesign of company mobile application with new UI/UX', 2, 'ACTIVE', '2024-02-01', '2024-05-31', NOW(), NOW()),
# (3, 'API Gateway', 'Microservices API gateway implementation', 1, 'PLANNING', '2024-03-01', '2024-08-31', NOW(), NOW());
#
# -- Insert Tasks
# INSERT INTO tasks (task_id, title, description, created_by, project_id, category_id, priority_id, task_type, status, difficulty_level, estimated_hours, actual_hours, progress_percentage, start_date, due_date, completed_at, created_at, updated_at) VALUES
# -- E-Commerce Platform Tasks
# (1, 'Design User Authentication', 'Design and implement user authentication system with JWT', 4, 1, 1, 3, 'ASSIGNED', 'IN_PROGRESS', 'MEDIUM', 16, 8, 50.00, '2024-01-15', '2024-01-25', NULL, NOW(), NOW()),
# (2, 'Create Product Catalog UI', 'Design and implement product catalog interface', 6, 1, 2, 2, 'ASSIGNED', 'COMPLETED', 'EASY', 12, 10, 100.00, '2024-01-10', '2024-01-20', NOW(), NOW(), NOW()),
# (3, 'Implement Shopping Cart', 'Backend implementation of shopping cart functionality', 5, 1, 1, 3, 'ASSIGNED', 'ASSIGNED', 'HARD', 20, 0, 0.00, '2024-01-25', '2024-02-10', NULL, NOW(), NOW()),
# (4, 'Test Payment Integration', 'Comprehensive testing of payment gateway integration', 7, 1, 3, 4, 'ASSIGNED', 'DRAFT', 'MEDIUM', 8, 0, 0.00, '2024-02-15', '2024-02-25', NULL, NOW(), NOW()),
#
# -- Mobile App Redesign Tasks
# (5, 'Design New App Icons', 'Create new app icons for different screen sizes', 6, 2, 2, 2, 'ASSIGNED', 'IN_PROGRESS', 'EASY', 6, 3, 50.00, '2024-02-05', '2024-02-15', NULL, NOW(), NOW()),
# (6, 'Redesign Home Screen', 'Complete redesign of the app home screen', 6, 2, 2, 3, 'ASSIGNED', 'ASSIGNED', 'MEDIUM', 15, 0, 0.00, '2024-02-20', '2024-03-10', NULL, NOW(), NOW()),
#
# -- Personal Tasks
# (7, 'Update Documentation', 'Update API documentation for new endpoints', 4, NULL, 4, 1, 'PERSONAL', 'IN_PROGRESS', 'EASY', 4, 2, 50.00, '2024-01-20', '2024-01-25', NULL, NOW(), NOW()),
# (8, 'Code Review Meeting', 'Weekly code review meeting with team', 2, NULL, 5, 2, 'TEAM', 'COMPLETED', 'EASY', 1, 1, 100.00, '2024-01-22', '2024-01-22', NOW(), NOW(), NOW());
#
# -- Insert Task Assignments
# INSERT INTO task_assignments (assignment_id, task_id, assigned_by, assigned_to, assigned_at, accepted_at, assignment_status, assignment_notes) VALUES
# (1, 1, 2, 4, NOW(), NOW(), 'ACCEPTED', 'Please implement JWT authentication with refresh tokens'),
# (2, 2, 3, 6, NOW(), NOW(), 'ACCEPTED', 'Focus on responsive design and accessibility'),
# (3, 3, 2, 5, NOW(), NULL, 'PENDING', 'Implement with Redis for session management'),
# (4, 4, 2, 7, NOW(), NOW(), 'ACCEPTED', 'Test all payment methods thoroughly'),
# (5, 5, 3, 6, NOW(), NOW(), 'ACCEPTED', 'Create icons for iOS and Android platforms'),
# (6, 6, 3, 6, NOW(), NULL, 'PENDING', 'Follow the new design system guidelines');
#
# -- Insert Task Progress
# INSERT INTO task_progress (progress_id, task_id, updated_by, previous_percentage, current_percentage, progress_notes, updated_at) VALUES
# (1, 1, 4, 0.00, 25.00, 'Started implementing JWT authentication', NOW()),
# (2, 1, 4, 25.00, 50.00, 'Completed JWT token generation and validation', NOW()),
# (3, 2, 6, 0.00, 100.00, 'Product catalog UI completed and tested', NOW()),
# (4, 5, 6, 0.00, 50.00, 'Completed iOS app icons, working on Android', NOW()),
# (5, 7, 4, 0.00, 50.00, 'Updated authentication API documentation', NOW());
#
# -- Insert Task Difficulties
# INSERT INTO task_difficulties (difficulty_id, task_id, reported_by, difficulty_description, impact_level, criticality_level, suggested_solution, is_resolved, reported_at, resolved_at) VALUES
# (1, 1, 4, 'JWT refresh token implementation is more complex than expected', 'MEDIUM', 'IMPORTANT', 'Need additional research on refresh token best practices', false, NOW(), NULL),
# (2, 3, 5, 'Redis configuration for session management is not working properly', 'HIGH', 'URGENT', 'Need DevOps team assistance for Redis setup', false, NOW(), NULL);
#
# -- Insert Comments
# INSERT INTO comments (comment_id, task_id, user_id, comment_text, is_private, created_at, updated_at) VALUES
# (1, 1, 2, 'Great progress on the authentication system! Keep up the good work.', false, NOW(), NOW()),
# (2, 1, 4, 'Thanks! I will complete the refresh token implementation by tomorrow.', false, NOW(), NOW()),
# (3, 2, 3, 'The product catalog looks amazing! Ready for production deployment.', false, NOW(), NOW()),
# (4, 3, 5, 'Need help with Redis configuration. Can someone assist?', false, NOW(), NOW());
#
# -- Insert Comment Replies
# INSERT INTO comment_replies (reply_id, parent_comment_id, user_id, reply_text, created_at, updated_at) VALUES
# (1, 4, 2, 'I will help you with Redis setup. Let me know when you are available.', NOW(), NOW()),
# (2, 4, 5, 'Thanks! I am available tomorrow morning.', NOW(), NOW());
#
# -- Insert Weekly Planning
# INSERT INTO weekly_plannings (planning_id, user_id, week_number, year, week_start_date, week_end_date, compliance_status, total_tasks_planned, submitted_at, is_approved, approved_by, created_at, updated_at) VALUES
# (1, 4, 4, 2024, '2024-01-22', '2024-01-28', 'COMPLIANT', 5, NOW(), true, 2, NOW(), NOW()),
# (2, 5, 4, 2024, '2024-01-22', '2024-01-28', 'PARTIALLY_COMPLIANT', 3, NOW(), false, NULL, NOW(), NOW()),
# (3, 6, 4, 2024, '2024-01-22', '2024-01-28', 'COMPLIANT', 4, NOW(), true, 3, NOW(), NOW());
#
# -- Insert Daily Task Schedules
# INSERT INTO daily_task_schedules (schedule_id, planning_id, task_id, scheduled_date, start_time, end_time, estimated_duration_minutes, day_of_week, is_completed) VALUES
# -- Week 4 Planning for Alice (Developer)
# (1, 1, 1, '2024-01-22', '09:00:00', '12:00:00', 180, 'MONDAY', false),
# (2, 1, 1, '2024-01-23', '09:00:00', '17:00:00', 480, 'TUESDAY', false),
# (3, 1, 7, '2024-01-24', '14:00:00', '16:00:00', 120, 'WEDNESDAY', false),
# (4, 1, 1, '2024-01-25', '09:00:00', '17:00:00', 480, 'THURSDAY', false),
# (5, 1, 1, '2024-01-26', '09:00:00', '12:00:00', 180, 'FRIDAY', false),
#
# -- Week 4 Planning for Bob (Developer)
# (6, 2, 3, '2024-01-22', '09:00:00', '17:00:00', 480, 'MONDAY', false),
# (7, 2, 3, '2024-01-23', '09:00:00', '17:00:00', 480, 'TUESDAY', false),
# (8, 2, 3, '2024-01-24', '09:00:00', '17:00:00', 480, 'WEDNESDAY', false),
#
# -- Week 4 Planning for Emma (Designer)
# (9, 3, 5, '2024-01-22', '09:00:00', '12:00:00', 180, 'MONDAY', true),
# (10, 3, 5, '2024-01-23', '09:00:00', '12:00:00', 180, 'TUESDAY', true),
# (11, 3, 6, '2024-01-24', '09:00:00', '17:00:00', 480, 'WEDNESDAY', false),
# (12, 3, 6, '2024-01-25', '09:00:00', '17:00:00', 480, 'THURSDAY', false);
#
# -- Insert Notifications
# INSERT INTO notifications (notification_id, user_id, notification_type_id, title, message, action_url, is_read, priority, metadata, sent_at, read_at, expires_at) VALUES
# (1, 4, 1, 'Task Assigned', 'You have been assigned a new task: Design User Authentication', '/tasks/1', false, 'NORMAL', '{"taskId": 1}', NOW(), NULL, DATE_ADD(NOW(), INTERVAL 7 DAY)),
# (2, 2, 2, 'Task Completed', 'Task "Create Product Catalog UI" has been completed by Emma Designer', '/tasks/2', false, 'NORMAL', '{"taskId": 2}', NOW(), NULL, DATE_ADD(NOW(), INTERVAL 7 DAY)),
# (3, 5, 3, 'Task Overdue', 'Task "Implement Shopping Cart" is overdue. Please update the progress.', '/tasks/3', false, 'HIGH', '{"taskId": 3}', NOW(), NULL, DATE_ADD(NOW(), INTERVAL 3 DAY));
#
# -- Insert Notification Preferences
# INSERT INTO notification_preferences (preference_id, user_id, notification_type_id, email_enabled, push_enabled, sms_enabled, custom_settings, updated_at) VALUES
# (1, 4, 1, true, true, false, '{"reminder_frequency": "daily"}', NOW()),
# (2, 4, 2, true, true, false, '{}', NOW()),
# (3, 4, 3, true, true, true, '{"escalation_hours": 24}', NOW()),
# (4, 5, 1, true, false, false, '{}', NOW()),
# (5, 6, 1, true, true, false, '{}', NOW());
#
# -- Insert User Performance Metrics
# INSERT INTO user_performance_metrics (metric_id, user_id, metric_date, tasks_completed, tasks_overdue, average_completion_time_hours, planning_compliance_rate, satisfaction_score, total_tasks_assigned, calculated_at) VALUES
# (1, 4, '2024-01-20', 2, 0, 12.50, 85.00, 4.20, 3, NOW()),
# (2, 5, '2024-01-20', 0, 1, 0.00, 60.00, 3.80, 2, NOW()),
# (3, 6, '2024-01-20', 1, 0, 8.00, 90.00, 4.50, 2, NOW()),
# (4, 7, '2024-01-20', 0, 0, 0.00, 75.00, 4.00, 1, NOW());
#
# -- Insert Team Performance Metrics
# INSERT INTO team_performance_metrics (metric_id, team_id, metric_date, total_team_members, total_tasks_completed, total_tasks_overdue, team_productivity_score, average_task_completion_rate, calculated_at) VALUES
# (1, 1, '2024-01-20', 4, 3, 1, 75.00, 80.00, NOW()),
# (2, 2, '2024-01-20', 2, 1, 0, 85.00, 90.00, NOW());
#
# -- Insert User Sessions
# INSERT INTO user_sessions (session_id, user_id, session_token, ip_address, user_agent, is_active, created_at, last_activity_at, expires_at) VALUES
# (1, 1, 'admin_session_token_123', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR)),
# (2, 4, 'dev_session_token_456', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR)),
# (3, 6, 'designer_session_token_789', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR));
#
# -- Insert Audit Logs
# INSERT INTO audit_logs (log_id, user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent, action_timestamp) VALUES
# (1, 1, 'CREATE', 'users', 4, NULL, '{"email": "developer1@company.com", "firstName": "Alice", "lastName": "Developer"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW()),
# (2, 2, 'UPDATE', 'tasks', 1, '{"status": "ASSIGNED"}', '{"status": "IN_PROGRESS"}', '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW()),
# (3, 6, 'UPDATE', 'tasks', 2, '{"status": "IN_PROGRESS"}', '{"status": "COMPLETED"}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW());