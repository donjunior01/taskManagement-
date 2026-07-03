-- ===================================
-- SAMPLE DATA FOR MTN CAMEROON
-- Task Planning & Management System
-- ===================================

-- Note: Using IDs starting from 100 to avoid conflicts with DataInitializer
-- Password for all users: password123 (Argon2id encoded)

-- ===================================
-- USERS (MTN Cameroon employees)
-- ===================================

INSERT IGNORE INTO allUsers (id, username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
(100, 'mtn_admin', 'admin@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Admin', 'MTN', 'ADMIN', true, NOW(), NOW()),
(101, 'pm_nkoulou', 'nkoulou.pm@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Jean-Pierre', 'Nkoulou', 'PROJECT_MANAGER', true, NOW(), NOW()),
(102, 'pm_tchinda', 'tchinda.pm@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Marie', 'Tchinda', 'PROJECT_MANAGER', true, NOW(), NOW()),
(103, 'user_mbarga', 'mbarga@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Paul', 'Mbarga', 'USER', true, NOW(), NOW()),
(104, 'user_fotso', 'fotso@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Sandrine', 'Fotso', 'USER', true, NOW(), NOW()),
(105, 'user_ngono', 'ngono@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Emmanuel', 'Ngono', 'USER', true, NOW(), NOW()),
(106, 'user_eyebe', 'eyebe@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Carine', 'Eyebe', 'USER', true, NOW(), NOW()),
(107, 'user_tabi', 'tabi@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Francis', 'Francis', 'USER', true, NOW(), NOW()),
(108, 'user_kamga', 'kamga@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Berthe', 'Kamga', 'USER', true, NOW(), NOW()),
(109, 'user_nana', 'nana@mtncameroon.cm', '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE', 'Olivier', 'Nana', 'USER', true, NOW(), NOW());

-- Migrate seed accounts to the Argon2id hash on existing databases (INSERT IGNORE above does NOT
-- update rows that already exist, so installs created under BCrypt keep stale $2a$ hashes otherwise).
-- Scoped to the 10 demo accounts; password remains "password123".
UPDATE allUsers
SET password = '$argon2id$v=19$m=19456,t=2,p=1$9s10ahVyPzGdjdzt4Jo4rQ$gn+nsknCjuh1mWvwRUMw9vXbubjQ7R2lHGzi0lx2QHE'
WHERE id BETWEEN 100 AND 109 AND password LIKE '$2%';

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

-- Seed/legacy projects have no creator on record, which makes the "Created by" column blank.
-- Attribute them to the seed administrator. Only touches rows still NULL, so projects
-- genuinely created by a user (created_by already set) are never overwritten. Idempotent.
UPDATE projects SET created_by = 100 WHERE created_by IS NULL;

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

-- NOTE: No mock deliverables are seeded — they referenced files that don't exist on disk,
-- so their downloads always failed. The statements below purge any previously-seeded mock
-- rows (matched by their exact placeholder paths) and any empty-file rows created by earlier
-- bugs, on every startup. Real user uploads (paths like /uploads/<timestamp>_<uuid>.<ext>)
-- are never matched, so they are preserved.
DELETE FROM deliverables WHERE file_path IN (
    '/uploads/akwa_tower_report.pdf', '/uploads/network_config.xlsx', '/uploads/momo_api_docs.pdf',
    '/uploads/portal_mockups.fig', '/uploads/datacenter_photos.zip', '/uploads/fiber_route.kml',
    '/uploads/5g_training.mp4', '/uploads/fraud_model.pkl', '/uploads/site_photos.zip',
    '/uploads/test_results.pdf'
);
DELETE FROM deliverables WHERE file_path IS NULL OR TRIM(file_path) = '' OR file_name IS NULL OR TRIM(file_name) = '';

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

-- =====================================================================
-- DEMO SEED for org 1 (MTN Cameroon) — fills the empty tenant tables so
-- every feature page shows realistic data. INSERT IGNORE + explicit ids
-- make this idempotent (re-runs on every boot are no-ops). Added 2026-06.
-- =====================================================================

-- Custom roles (Admin > Roles)
INSERT IGNORE INTO `roles` (id, organization_id, name, description, is_system, created_at) VALUES
(1,1,'Network Engineer','Field and core network engineering access',false,NOW()),
(2,1,'Finance Lead','Billing, plan and reporting access',false,NOW()),
(3,1,'QA Reviewer','Reviews and approves deliverables',false,NOW()),
(4,1,'Support Agent','Handles support tickets and user queries',false,NOW()),
(5,1,'Read-only Auditor','Read access to projects, tasks and logs',false,NOW());
-- role_permissions has no single PK, so clear the seed roles' perms first to stay idempotent across boots.
DELETE FROM `role_permissions` WHERE role_id IN (1,2,3,4,5);
INSERT IGNORE INTO `role_permissions` (role_id, permission) VALUES
(1,'project.view'),(1,'task.view'),(1,'task.edit'),(1,'team.view'),(1,'deliverable.view'),
(2,'project.view'),(2,'report.view'),(2,'billing.manage'),
(3,'task.view'),(3,'deliverable.view'),(3,'deliverable.review'),
(4,'project.view'),(4,'task.view'),(4,'user.view'),
(5,'project.view'),(5,'task.view'),(5,'report.view'),(5,'audit.view');

-- Custom fields (Admin > Custom Fields)
INSERT IGNORE INTO `custom_field_definitions` (id, organization_id, name, field_type, options, required, display_order, active, created_at) VALUES
(1,1,'Sprint','TEXT',NULL,false,0,true,NOW()),
(2,1,'Story Points','NUMBER',NULL,false,1,true,NOW()),
(3,1,'Customer','TEXT',NULL,false,2,true,NOW()),
(4,1,'Go-Live Date','DATE',NULL,false,3,true,NOW()),
(5,1,'Severity','SELECT','Low,Medium,High,Critical',true,4,true,NOW()),
(6,1,'Billable','CHECKBOX',NULL,false,5,true,NOW());

-- Task templates (Admin > Task Templates)
INSERT IGNORE INTO `task_templates` (id, organization_id, name, task_name, description, priority, difficulty, default_deadline_days, custom_fields, active, created_at) VALUES
(1,1,'Bug Report','Bug: ','Steps to reproduce, expected vs actual result, environment.','HIGH','MEDIUM',3,NULL,true,NOW()),
(2,1,'Network Incident','Incident: ','Impact, affected sites, root cause, mitigation steps.','CRITICAL','HARD',1,NULL,true,NOW()),
(3,1,'New Feature','Feature: ','User story, acceptance criteria, definition of done.','MEDIUM','MEDIUM',14,NULL,true,NOW()),
(4,1,'Employee Onboarding','Onboard new hire','Accounts, equipment, training plan, buddy assignment.','MEDIUM','EASY',7,NULL,true,NOW()),
(5,1,'Site Survey','Site survey: ','Location, access, power, line of sight, photos.','LOW','EASY',5,NULL,true,NOW());

-- Custom workflow columns (Admin > Workflows)
INSERT IGNORE INTO `workflow_statuses` (id, organization_id, name, category, color, display_order, active, created_at) VALUES
(1,1,'Backlog','TODO','#64748b',0,true,NOW()),
(2,1,'Ready','TODO','#2563eb',1,true,NOW()),
(3,1,'In Progress','IN_PROGRESS','#0891b2',2,true,NOW()),
(4,1,'In Review','IN_PROGRESS','#7c3aed',3,true,NOW()),
(5,1,'Blocked','IN_PROGRESS','#ef4444',4,true,NOW()),
(6,1,'Done','DONE','#16a34a',5,true,NOW());

-- Knowledge base (Wiki)
INSERT IGNORE INTO `wiki_pages` (id, organization_id, title, content, parent_id, icon, created_by_id, created_by_name, updated_by_id, updated_by_name, created_at, updated_at) VALUES
(1,1,'Engineering Handbook','# Engineering Handbook. Welcome to the MTN engineering knowledge base — standards, runbooks and how-to guides live here.',NULL,'📘',100,'Admin MTN',100,'Admin MTN',NOW(),NOW()),
(2,1,'Onboarding Guide','# Onboarding. New here? Get your accounts, set up your laptop, and meet your team. Ask your buddy for anything missing.',1,'🚀',100,'Admin MTN',100,'Admin MTN',NOW(),NOW()),
(3,1,'Network Operations Runbook','# NOC Runbook. Procedures for monitoring the 5G core, raising incidents and coordinating field engineers.',1,'🛠️',101,'Jean-Pierre Nkoulou',101,'Jean-Pierre Nkoulou',NOW(),NOW()),
(4,1,'Incident Response Process','# Incident Response. Detect, triage, mitigate, then run a blameless post-mortem within 48 hours.',NULL,'🚨',101,'Jean-Pierre Nkoulou',101,'Jean-Pierre Nkoulou',NOW(),NOW()),
(5,1,'Release Checklist','# Release Checklist. Tests green, changelog updated, stakeholders notified, rollback plan ready.',NULL,'✅',102,'Marie Tchinda',102,'Marie Tchinda',NOW(),NOW()),
(6,1,'Glossary','# Glossary. 5G fifth-generation mobile network. NOC Network Operations Center. QoS Quality of Service.',NULL,'📖',100,'Admin MTN',100,'Admin MTN',NOW(),NOW());

-- OKRs (Objectives + Key Results)
INSERT IGNORE INTO `objectives` (id, organization_id, title, description, period, owner_id, owner_name, status, created_at) VALUES
(1,1,'Expand 5G coverage across Douala','Bring fast, reliable 5G to the metro area','Q1 2026',101,'Jean-Pierre Nkoulou','ON_TRACK',NOW()),
(2,1,'Cut network incident resolution time','Recover from incidents faster','Q1 2026',101,'Jean-Pierre Nkoulou','AT_RISK',NOW()),
(3,1,'Reach 95% customer satisfaction','Improve support quality and NPS','Q1 2026',102,'Marie Tchinda','ON_TRACK',NOW()),
(4,1,'Migrate billing to the cloud','Decommission the legacy billing platform','Q2 2026',102,'Marie Tchinda','OFF_TRACK',NOW()),
(5,1,'Grow enterprise revenue','Win and retain enterprise accounts','2026',100,'Admin MTN','ON_TRACK',NOW());
INSERT IGNORE INTO `key_results` (id, organization_id, objective_id, title, start_value, target_value, current_value, unit) VALUES
(1,1,1,'5G towers live',0,120,78,'towers'),
(2,1,1,'Population coverage',35,60,47,'%'),
(3,1,2,'Average resolution time',48,12,30,'hours'),
(4,1,2,'Incidents auto-detected',40,90,65,'%'),
(5,1,3,'Customer satisfaction',82,95,90,'%'),
(6,1,3,'First-response time',8,2,4,'hours'),
(7,1,4,'Customers migrated',0,100,55,'%'),
(8,1,4,'Legacy systems retired',0,3,1,'systems'),
(9,1,5,'New enterprise accounts',0,25,11,'accounts'),
(10,1,5,'Net revenue retention',100,120,108,'%');

-- Automation rules (Admin > Automations)
INSERT IGNORE INTO `automation_rules` (id, organization_id, name, enabled, `trigger`, condition_field, condition_value, action_type, action_value, created_at, last_run_at, run_count) VALUES
(1,1,'Escalate critical tasks',true,'task.created','priority','CRITICAL','notify','101',NOW(),NULL,0),
(2,1,'Notify PM on completion',true,'task.completed',NULL,NULL,'notify','101',NOW(),NULL,0),
(3,1,'Raise priority on overdue',true,'task.status_changed','status','OVERDUE','set_priority','HIGH',NOW(),NULL,0),
(4,1,'Assign 5G project tasks to lead',true,'task.created','projectId','100','assign','103',NOW(),NULL,0),
(5,1,'Alert admin on assignment',true,'task.assigned',NULL,NULL,'notify','100',NOW(),NULL,0);

-- Deliverables (PM/User > Deliverables)
INSERT IGNORE INTO `deliverables` (id, organization_id, task_id, submitted_by_id, file_name, file_path, status, submitted_at, created_at, updated_at) VALUES
(1,1,100,103,'akwa-5g-site-plan.pdf','/uploads/deliverables/akwa-5g-site-plan.pdf','PENDING',NOW(),NOW(),NOW()),
(2,1,101,104,'tower-config-report.xlsx','/uploads/deliverables/tower-config-report.xlsx','APPROVED',NOW(),NOW(),NOW()),
(3,1,102,105,'coverage-heatmap.png','/uploads/deliverables/coverage-heatmap.png','PENDING',NOW(),NOW(),NOW()),
(4,1,103,106,'migration-runbook.docx','/uploads/deliverables/migration-runbook.docx','REJECTED',NOW(),NOW(),NOW()),
(5,1,104,107,'qos-test-results.csv','/uploads/deliverables/qos-test-results.csv','PENDING',NOW(),NOW(),NOW());

-- Support tickets (Admin/User > Support)
INSERT IGNORE INTO `support_tickets` (id, organization_id, user_id, subject, description, priority, status, assigned_to_id, created_at, updated_at) VALUES
(1,1,103,'Cannot access deliverables page','I get a 403 error when opening the deliverables page','HIGH','OPEN',100,NOW(),NOW()),
(2,1,104,'Calendar not syncing','My Google calendar events do not show up','MEDIUM','IN_PROGRESS',100,NOW(),NOW()),
(3,1,105,'Request new project access','I need access to the 5G Douala project','LOW','RESOLVED',101,NOW(),NOW()),
(4,1,106,'Password reset email not received','No email arrives after I request a reset','URGENT','OPEN',100,NOW(),NOW()),
(5,1,107,'PDF export fails','Exporting a report to PDF throws an error','MEDIUM','CLOSED',101,NOW(),NOW());

-- API keys (Admin > API Keys)
INSERT IGNORE INTO `api_keys` (id, organization_id, name, key_hash, key_prefix, created_by, created_at, revoked) VALUES
(1,1,'CI Pipeline','seed_hash_ci_0001','tm_live_ci',100,NOW(),false),
(2,1,'Billing Integration','seed_hash_bill_0002','tm_live_bl',100,NOW(),false),
(3,1,'Mobile App Backend','seed_hash_mob_0003','tm_live_mb',100,NOW(),false),
(4,1,'Reporting Export','seed_hash_rep_0004','tm_live_rp',100,NOW(),false),
(5,1,'Legacy Sync','seed_hash_leg_0005','tm_live_lg',100,NOW(),true);

-- Webhook subscriptions (Admin > Webhooks)
INSERT IGNORE INTO `webhook_subscriptions` (id, organization_id, url, secret, active, created_at) VALUES
(1,1,'https://hooks.mtncameroon.cm/tasks','whsec_seed_0001',true,NOW()),
(2,1,'https://hooks.mtncameroon.cm/deliverables','whsec_seed_0002',true,NOW()),
(3,1,'https://ops.mtncameroon.cm/webhooks/incidents','whsec_seed_0003',true,NOW()),
(4,1,'https://chat.example.com/services/seed','whsec_seed_0004',true,NOW()),
(5,1,'https://legacy.example.com/hook','whsec_seed_0005',false,NOW());

-- Pending invitations (Admin > Users > Invite)
INSERT IGNORE INTO `invitations` (id, organization_id, email, token, role, invited_by_name, created_at, expires_at, accepted) VALUES
(1,1,'awono@mtncameroon.cm','seed-invite-token-0001','USER','Admin MTN',NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY),false),
(2,1,'biya@mtncameroon.cm','seed-invite-token-0002','USER','Admin MTN',NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY),false),
(3,1,'essomba.pm@mtncameroon.cm','seed-invite-token-0003','PROJECT_MANAGER','Admin MTN',NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY),false),
(4,1,'manga@mtncameroon.cm','seed-invite-token-0004','USER','Marie Tchinda',NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY),false),
(5,1,'owona@mtncameroon.cm','seed-invite-token-0005','USER','Jean-Pierre Nkoulou',NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY),false);

-- Task checklist items / sub-tasks (PM task detail)
INSERT IGNORE INTO `task_checklist_items` (id, organization_id, task_id, title, completed, position, created_at) VALUES
(1,1,100,'Survey the site',true,0,NOW()),
(2,1,100,'Order equipment',true,1,NOW()),
(3,1,100,'Mount the antenna',false,2,NOW()),
(4,1,100,'Run QoS tests',false,3,NOW()),
(5,1,101,'Configure base station',true,0,NOW()),
(6,1,101,'Update asset inventory',false,1,NOW());
