package com.example.gpiApp.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminPageController {

    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/adminDashboard";
    }

    @GetMapping("/user-management")
    public String userManagement() {
        return "admin/userManagement";
    }

    @GetMapping("/create-user")
    public String createUser() {
        return "admin/createUser";
    }

    @GetMapping("/roles-permissions")
    public String rolesPermissions() {
        return "admin/rolesAndPermission";
    }

    @GetMapping("/project-management")
    public String projectManagement() {
        return "admin/projectManagement";
    }

    @GetMapping("/global-tasks")
    public String globalTasks() {
        return "admin/globalTasks";
    }

    @GetMapping("/team-assignment")
    public String teamAssignment() {
        return "admin/teamAssignment";
    }

    @GetMapping("/global-reports")
    public String globalReports() {
        return "admin/globalReports";
    }

    @GetMapping("/activity-logs")
    public String activityLogs() {
        return "admin/activityLogs";
    }

    @GetMapping("/system-settings")
    public String systemSettings() {
        return "admin/systemSettings";
    }

    @GetMapping("/integrations")
    public String integrations() {
        return "admin/integration";
    }

    @GetMapping("/security-backups")
    public String securityBackups() {
        return "admin/securityAndBackups";
    }

    @GetMapping("/support")
    public String supportCenter() {
        return "admin/supportCenter";
    }

    // Additional admin pages to cover full requirements
    @GetMapping("/email-integration")
    public String emailIntegration() {
        return "admin/emailIntegration";
    }

    @GetMapping("/calendar-integration")
    public String calendarIntegration() {
        return "admin/calendarIntegration";
    }

    @GetMapping("/external-integrations")
    public String externalIntegrations() {
        return "admin/externalIntegrations";
    }

    @GetMapping("/system-health")
    public String systemHealth() {
        return "admin/systemHealth";
    }

    @GetMapping("/security-logs")
    public String securityLogs() {
        return "admin/securityLogs";
    }

    @GetMapping("/backup-configuration")
    public String backupConfiguration() {
        return "admin/backupConfiguration";
    }

    @GetMapping("/report-scheduling")
    public String reportScheduling() {
        return "admin/reportScheduling";
    }

    @GetMapping("/team-performance")
    public String teamPerformance() {
        return "admin/teamPerformance";
    }

    @GetMapping("/team-collaboration-monitor")
    public String teamCollaborationMonitor() {
        return "admin/teamCollaborationMonitor";
    }

    @GetMapping("/notification-templates")
    public String notificationTemplates() {
        return "admin/notificationTemplates";
    }

    @GetMapping("/global-task-categories")
    public String globalTaskCategories() {
        return "admin/globalTaskCategories";
    }

    @GetMapping("/priority-levels")
    public String priorityLevels() {
        return "admin/priorityLevels";
    }

    @GetMapping("/security-settings")
    public String securitySettings() {
        return "admin/securitySettings";
    }

    @GetMapping("/password-policies")
    public String passwordPolicies() {
        return "admin/passwordPolicies";
    }
}


