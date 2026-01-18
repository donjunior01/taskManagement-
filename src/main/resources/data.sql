-- ===================================
-- SAMPLE DATA FOR MTN CAMEROON
-- Task Planning & Management System
-- ===================================

-- Note: Using IDs starting from 100 to avoid conflicts with DataInitializer
-- Password for all users: password123 (BCrypt encoded)

-- ===================================
-- USERS (MTN Cameroon employees)
-- ===================================

INSERT IGNORE INTO allUsers (id, username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
(100, 'mtn_admin', 'admin@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Admin', 'MTN', 'ADMIN', true, NOW(), NOW()),
(101, 'pm_nkoulou', 'nkoulou.pm@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Jean-Pierre', 'Nkoulou', 'PROJECT_MANAGER', true, NOW(), NOW()),
(102, 'pm_tchinda', 'tchinda.pm@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Marie', 'Tchinda', 'PROJECT_MANAGER', true, NOW(), NOW()),
(103, 'user_mbarga', 'mbarga@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Paul', 'Mbarga', 'USER', true, NOW(), NOW()),
(104, 'user_fotso', 'fotso@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Sandrine', 'Fotso', 'USER', true, NOW(), NOW()),
(105, 'user_ngono', 'ngono@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Emmanuel', 'Ngono', 'USER', true, NOW(), NOW()),
(106, 'user_eyebe', 'eyebe@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Carine', 'Eyebe', 'USER', true, NOW(), NOW()),
(107, 'user_tabi', 'tabi@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Francis', 'Tabi', 'USER', true, NOW(), NOW()),
(108, 'user_kamga', 'kamga@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Berthe', 'Kamga', 'USER', true, NOW(), NOW()),
(109, 'user_nana', 'nana@mtncameroon.cm', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.QPhR5Cr8gPdzREOb2G', 'Olivier', 'Nana', 'USER', true, NOW(), NOW());

-- ===================================
-- PROJECTS (10 projects for MTN Cameroon)
-- ===================================

INSERT IGNORE INTO projects (id, name, description, manager_id, start_date, end_date, status, progress, created_at, updated_at) VALUES
(100, 'Network 5G Expansion Douala', 'Deploy 5G network infrastructure across Douala metropolitan area', 101, '2024-01-15', '2024-06-30', 'ACTIVE', 45, NOW(), NOW()),
(101, 'Mobile Money Platform Upgrade', 'Upgrade MTN MoMo platform with new features', 101, '2024-02-01', '2024-05-31', 'ACTIVE', 60, NOW(), NOW()),
(102, 'Customer Service Portal Redesign', 'Modernize the customer self-service portal', 102, '2024-01-01', '2024-04-30', 'ACTIVE', 75, NOW(), NOW()),
(103, 'Rural Coverage Initiative', 'Extend network coverage to rural areas', 101, '2024-03-01', '2024-12-31', 'ACTIVE', 20, NOW(), NOW()),
(104, 'Data Center Yaounde', 'Build new data center facility in Yaounde', 102, '2023-10-01', '2024-08-31', 'ACTIVE', 55, NOW(), NOW()),
(105, 'Fiber Optic Backbone Project', 'Deploy fiber optic cables connecting major cities', 101, '2023-08-01', '2024-06-30', 'ON_HOLD', 40, NOW(), NOW()),
(106, 'Employee Training Program 2024', 'Comprehensive training program for staff', 102, '2024-01-01', '2024-12-31', 'ACTIVE', 30, NOW(), NOW()),
(107, 'Security Infrastructure Upgrade', 'Upgrade cybersecurity systems', 101, '2024-02-15', '2024-07-31', 'ACTIVE', 35, NOW(), NOW()),
(108, 'IoT Platform Development', 'Develop IoT platform for smart city projects', 102, '2024-04-01', '2024-10-31', 'ACTIVE', 15, NOW(), NOW()),
(109, 'Legacy System Migration', 'Migrate billing and CRM to cloud', 101, '2023-06-01', '2024-03-31', 'COMPLETED', 100, NOW(), NOW());

-- ===================================
-- TEAMS (10 teams)
-- ===================================

INSERT IGNORE INTO teams (id, name, description, project_id, created_at, updated_at) VALUES
(100, 'Network Engineering Douala', 'Team responsible for 5G network deployment', 100, NOW(), NOW()),
(101, 'MoMo Development Team', 'Mobile Money platform development team', 101, NOW(), NOW()),
(102, 'UX/UI Design Team', 'User experience and interface design', 102, NOW(), NOW()),
(103, 'Rural Deployment Squad', 'Field team for rural network deployment', 103, NOW(), NOW()),
(104, 'Infrastructure Team', 'Data center and infrastructure management', 104, NOW(), NOW()),
(105, 'Fiber Installation Crew', 'Fiber optic installation and maintenance', 105, NOW(), NOW()),
(106, 'HR Training Division', 'Employee training and development', 106, NOW(), NOW()),
(107, 'Cybersecurity Unit', 'Information security and fraud prevention', 107, NOW(), NOW()),
(108, 'IoT Innovation Lab', 'Research and development for IoT', 108, NOW(), NOW()),
(109, 'Cloud Migration Team', 'System migration and cloud infrastructure', 109, NOW(), NOW());

-- ===================================
-- TEAM MEMBERS
-- ===================================

INSERT IGNORE INTO team_members (id, team_id, user_id, role, joined_at) VALUES
(100, 100, 103, 'MEMBER', NOW()),
(101, 100, 104, 'MEMBER', NOW()),
(102, 101, 105, 'MEMBER', NOW()),
(103, 101, 106, 'MEMBER', NOW()),
(104, 102, 107, 'MEMBER', NOW()),
(105, 102, 108, 'MEMBER', NOW()),
(106, 103, 103, 'MEMBER', NOW()),
(107, 103, 109, 'MEMBER', NOW()),
(108, 104, 104, 'MEMBER', NOW()),
(109, 104, 105, 'MEMBER', NOW());

-- ===================================
-- TASKS (10 tasks)
-- ===================================

INSERT IGNORE INTO tasks (id, name, description, project_id, assigned_to_id, created_by_id, priority, difficulty, status, progress, deadline, reminder_type, created_at, updated_at) VALUES
(100, 'Install 5G towers in Akwa district', 'Deploy and configure 5G towers in Akwa', 100, 103, 101, 'HIGH', 'HARD', 'IN_PROGRESS', 60, '2024-03-15', 'EMAIL', NOW(), NOW()),
(101, 'Configure 5G network equipment', 'Set up and test 5G network equipment', 100, 104, 101, 'HIGH', 'HARD', 'IN_PROGRESS', 40, '2024-03-20', 'EMAIL', NOW(), NOW()),
(102, 'Develop international transfer module', 'Build international money transfer for MoMo', 101, 105, 101, 'CRITICAL', 'HARD', 'IN_PROGRESS', 70, '2024-02-28', 'EMAIL', NOW(), NOW()),
(103, 'Design new dashboard UI', 'Create modern dashboard for customer portal', 102, 107, 102, 'MEDIUM', 'MEDIUM', 'COMPLETED', 100, '2024-02-15', 'EMAIL', NOW(), NOW()),
(104, 'Survey Far North region sites', 'Conduct site surveys for network towers', 103, 103, 101, 'HIGH', 'MEDIUM', 'TODO', 0, '2024-04-01', 'EMAIL', NOW(), NOW()),
(105, 'Server room construction', 'Oversee server room construction', 104, 104, 102, 'HIGH', 'HARD', 'IN_PROGRESS', 55, '2024-04-30', 'EMAIL', NOW(), NOW()),
(106, 'Fiber route mapping Douala-Yaounde', 'Map optimal route for fiber optic cable', 105, 106, 101, 'MEDIUM', 'MEDIUM', 'ON_HOLD', 30, '2024-05-15', 'EMAIL', NOW(), NOW()),
(107, 'Prepare 5G training materials', 'Develop training materials for 5G technology', 106, 108, 102, 'MEDIUM', 'EASY', 'IN_PROGRESS', 45, '2024-03-31', 'EMAIL', NOW(), NOW()),
(108, 'Implement fraud detection algorithm', 'Deploy ML-based fraud detection system', 107, 105, 101, 'CRITICAL', 'HARD', 'IN_PROGRESS', 35, '2024-04-15', 'EMAIL', NOW(), NOW()),
(109, 'Design IoT sensor network', 'Create architecture for smart city IoT', 108, 107, 102, 'HIGH', 'HARD', 'TODO', 0, '2024-05-31', 'EMAIL', NOW(), NOW());

-- ===================================
-- COMMENTS (10 comments)
-- ===================================

INSERT IGNORE INTO comments (id, content, task_id, user_id, created_at) VALUES
(100, 'First tower installation completed successfully.', 100, 103, NOW()),
(101, 'Equipment arrived from supplier. Starting configuration.', 101, 104, NOW()),
(102, 'API integration with partner banks is 70% complete.', 102, 105, NOW()),
(103, 'Dashboard design approved by stakeholders!', 103, 102, NOW()),
(104, 'Regional coordinator confirmed for site surveys.', 104, 103, NOW()),
(105, 'Cooling system installation on schedule.', 105, 104, NOW()),
(106, 'Route mapping paused due to land disputes.', 106, 106, NOW()),
(107, 'Training videos recorded and being edited.', 107, 108, NOW()),
(108, 'Test results show 95% fraud detection accuracy.', 108, 105, NOW()),
(109, 'Architecture review meeting scheduled.', 109, 107, NOW());

-- ===================================
-- TIME LOGS (10 entries)
-- ===================================

INSERT IGNORE INTO time_logs (id, task_id, user_id, hours, log_date, description, created_at) VALUES
(100, 100, 103, 8.0, '2024-02-26', 'Tower foundation work', NOW()),
(101, 100, 103, 6.5, '2024-02-27', 'Antenna installation', NOW()),
(102, 101, 104, 7.0, '2024-02-26', 'Equipment inventory', NOW()),
(103, 102, 105, 8.5, '2024-02-25', 'API development', NOW()),
(104, 102, 105, 9.0, '2024-02-26', 'Testing transfers', NOW()),
(105, 105, 104, 8.0, '2024-02-24', 'Server rack installation', NOW()),
(106, 107, 108, 4.5, '2024-02-26', 'Recording training', NOW()),
(107, 108, 105, 7.5, '2024-02-27', 'ML implementation', NOW()),
(108, 103, 107, 5.0, '2024-02-15', 'UI mockup revisions', NOW()),
(109, 106, 106, 6.0, '2024-02-20', 'GIS mapping', NOW());

-- ===================================
-- DELIVERABLES (10 deliverables)
-- ===================================

INSERT IGNORE INTO deliverables (id, task_id, submitted_by_id, file_name, file_path, status, submitted_at, reviewed_at, reviewed_by_id, feedback, created_at, updated_at) VALUES
(100, 100, 103, 'akwa_tower_report.pdf', '/uploads/akwa_tower_report.pdf', 'APPROVED', NOW(), NOW(), 101, 'Excellent documentation', NOW(), NOW()),
(101, 101, 104, 'network_config.xlsx', '/uploads/network_config.xlsx', 'PENDING', NOW(), NULL, NULL, NULL, NOW(), NOW()),
(102, 102, 105, 'momo_api_docs.pdf', '/uploads/momo_api_docs.pdf', 'APPROVED', NOW(), NOW(), 101, 'Comprehensive API docs', NOW(), NOW()),
(103, 103, 107, 'portal_mockups.fig', '/uploads/portal_mockups.fig', 'APPROVED', NOW(), NOW(), 102, 'Beautiful design', NOW(), NOW()),
(104, 105, 104, 'datacenter_photos.zip', '/uploads/datacenter_photos.zip', 'PENDING', NOW(), NULL, NULL, NULL, NOW(), NOW()),
(105, 106, 106, 'fiber_route.kml', '/uploads/fiber_route.kml', 'REJECTED', NOW(), NOW(), 101, 'Route needs revision', NOW(), NOW()),
(106, 107, 108, '5g_training.mp4', '/uploads/5g_training.mp4', 'APPROVED', NOW(), NOW(), 102, 'Very informative', NOW(), NOW()),
(107, 108, 105, 'fraud_model.pkl', '/uploads/fraud_model.pkl', 'PENDING', NOW(), NULL, NULL, NULL, NOW(), NOW()),
(108, 100, 103, 'site_photos.zip', '/uploads/site_photos.zip', 'PENDING', NOW(), NULL, NULL, NULL, NOW(), NOW()),
(109, 102, 105, 'test_results.pdf', '/uploads/test_results.pdf', 'PENDING', NOW(), NULL, NULL, NULL, NOW(), NOW());

-- ===================================
-- MESSAGES (10 messages)
-- ===================================

INSERT IGNORE INTO messages (id, sender_id, recipient_id, project_id, content, is_read, created_at) VALUES
(100, 101, 103, 100, 'Paul, please provide status update on the tower installation.', true, NOW()),
(101, 103, 101, 100, 'Installation is 60% complete. Back on track now.', true, NOW()),
(102, 101, 105, 101, 'Emmanuel, how is the API integration going?', true, NOW()),
(103, 105, 101, 101, 'API integration progressing well. Testing starts next week.', true, NOW()),
(104, 102, 107, 102, 'The new dashboard design looks amazing! Great work!', true, NOW()),
(105, 107, 102, 102, 'Thank you! Starting frontend development tomorrow.', false, NOW()),
(106, 100, 101, NULL, 'Jean-Pierre, please schedule Q2 budget meeting.', true, NOW()),
(107, 101, 100, NULL, 'Meeting scheduled for Thursday at 10 AM.', true, NOW()),
(108, 102, 108, 106, 'Berthe, training materials needed before April.', true, NOW()),
(109, 108, 102, 106, 'All modules will be completed by March 25th.', false, NOW());

-- ===================================
-- CALENDAR EVENTS (10 events)
-- ===================================

INSERT IGNORE INTO calendar_events (id, title, description, start_time, end_time, all_day, event_type, entity_id, entity_type, user_id, color, location, reminder_minutes, is_synced, created_at, updated_at) VALUES
(100, '5G Network Launch Meeting', 'Discuss timeline for 5G launch', '2024-03-05 09:00:00', '2024-03-05 11:00:00', false, 'MEETING', 100, 'PROJECT', 101, '#4361ee', 'MTN Headquarters, Douala', 60, false, NOW(), NOW()),
(101, 'MoMo Feature Demo', 'Demo new international transfer features', '2024-03-10 14:00:00', '2024-03-10 16:00:00', false, 'MEETING', 101, 'PROJECT', 101, '#2a9d8f', 'Innovation Lab, Yaounde', 30, false, NOW(), NOW()),
(102, 'Portal Redesign Review', 'Review final portal mockups', '2024-03-08 10:00:00', '2024-03-08 12:00:00', false, 'REVIEW', 102, 'PROJECT', 102, '#f4a261', 'Conference Room A', 60, false, NOW(), NOW()),
(103, 'Task Deadline: 5G Tower Installation', 'Deadline for Akwa district towers', '2024-03-15 00:00:00', '2024-03-15 23:59:59', true, 'TASK_DEADLINE', 100, 'TASK', 103, '#e63946', NULL, 1440, false, NOW(), NOW()),
(104, 'Data Center Site Visit', 'Site inspection for new data center', '2024-03-12 08:00:00', '2024-03-12 17:00:00', false, 'MEETING', 104, 'PROJECT', 102, '#9b59b6', 'Data Center Yaounde Site', 120, false, NOW(), NOW()),
(105, 'Training Session: 5G Technology', 'Employee training on 5G fundamentals', '2024-03-20 09:00:00', '2024-03-20 17:00:00', false, 'MEETING', 106, 'PROJECT', 108, '#1abc9c', 'Training Center, Douala', 1440, false, NOW(), NOW()),
(106, 'Security Audit Kickoff', 'Initial meeting for security audit', '2024-03-07 11:00:00', '2024-03-07 13:00:00', false, 'MEETING', 107, 'PROJECT', 101, '#e74c3c', 'Security Operations Center', 60, false, NOW(), NOW()),
(107, 'Q1 Project Review', 'Quarterly review with management', '2024-03-28 09:00:00', '2024-03-28 12:00:00', false, 'REVIEW', NULL, NULL, 100, '#4361ee', 'Executive Boardroom', 1440, false, NOW(), NOW()),
(108, 'Rural Coverage Survey Trip', 'Field trip to Far North region', '2024-04-01 06:00:00', '2024-04-05 18:00:00', true, 'CUSTOM', 103, 'PROJECT', 103, '#f39c12', 'Far North Region', 4320, false, NOW(), NOW()),
(109, 'IoT Platform Kickoff', 'Project kickoff for IoT platform', '2024-04-01 10:00:00', '2024-04-01 12:00:00', false, 'MEETING', 108, 'PROJECT', 102, '#3498db', 'Innovation Hub, Douala', 60, false, NOW(), NOW());

-- ===================================
-- ACTIVITY LOGS (10 entries)
-- ===================================

INSERT IGNORE INTO activity_logs (id, activity_type, description, user_id, entity_type, entity_id, ip_address, created_at) VALUES
(100, 'USER_LOGIN', 'Admin logged in successfully', 100, 'USER', 100, '192.168.1.100', NOW()),
(101, 'PROJECT_CREATED', 'Project "5G Expansion Douala" created', 101, 'PROJECT', 100, '192.168.1.101', NOW()),
(102, 'TASK_CREATED', 'Task "Install 5G towers" created', 101, 'TASK', 100, '192.168.1.101', NOW()),
(103, 'TASK_ASSIGNED', 'Task assigned to Paul Mbarga', 101, 'TASK', 100, '192.168.1.101', NOW()),
(104, 'DELIVERABLE_SUBMITTED', 'Deliverable submitted for 5G tower task', 103, 'DELIVERABLE', 100, '192.168.1.102', NOW()),
(105, 'DELIVERABLE_REVIEWED', 'Deliverable approved', 101, 'DELIVERABLE', 100, '192.168.1.101', NOW()),
(106, 'TASK_UPDATED', 'Task progress updated to 70%', 105, 'TASK', 102, '192.168.1.103', NOW()),
(107, 'COMMENT_ADDED', 'Comment added to dashboard task', 102, 'TASK', 103, '192.168.1.104', NOW()),
(108, 'TIME_LOGGED', 'Time logged: 8.0 hours', 103, 'TASK', 100, '192.168.1.102', NOW()),
(109, 'MESSAGE_SENT', 'Message sent to project team', 101, 'PROJECT', 100, '192.168.1.101', NOW());

-- Print success message
SELECT 'MTN Cameroon sample data loaded successfully!' AS status;
