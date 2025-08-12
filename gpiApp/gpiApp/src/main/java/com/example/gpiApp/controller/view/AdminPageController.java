package com.example.gpiApp.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminPageController {

    @GetMapping("/adminDashboard")
    public String adminDashboard() {
        return "admin/adminDashboard";
    }

    @GetMapping("/userManagement")
    public String userManagement() {
        return "admin/userManagement";
    }

    @GetMapping("/createUser")
    public String createUser() {
        return "admin/createUser";
    }

    @GetMapping("/rolesAndPermissions")
    public String rolesPermissions() {
        return "admin/rolesAndPermissions";
    }

    @GetMapping("/projectManagement")
    public String projectManagement() {
        return "admin/projectManagement";
    }

    @GetMapping("/globalTasks")
    public String globalTasks() {
        return "admin/globalTasks";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment() {
        return "admin/teamAssignment";
    }

    @GetMapping("/globalReports")
    public String globalReports() {
        return "admin/globalReports";
    }

    @GetMapping("/activityLogs")
    public String activityLogs() {
        return "admin/activityLogs";
    }

    @GetMapping("/systemSettings")
    public String systemSettings() {
        return "admin/systemSettings";
    }

    @GetMapping("/integrations")
    public String integrations() {
        return "admin/integration";
    }

    @GetMapping("/securityAndBackups")
    public String securityBackups() {
        return "admin/securityAndBackups";
    }

    @GetMapping("/support")
    public String supportCenter() {
        return "admin/supportCenter";
    }

    // Additional admin pages to cover full requirements
    @GetMapping("/emailIntegration")
    public String emailIntegration() {
        return "admin/emailIntegration";
    }

    @GetMapping("/calendarIntegration")
    public String calendarIntegration() {
        return "admin/calendarIntegration";
    }

    @GetMapping("/externalIntegrations")
    public String externalIntegrations() {
        return "admin/externalIntegrations";
    }

    @GetMapping("/systemHealth")
    public String systemHealth() {
        return "admin/systemHealth";
    }

    @GetMapping("/securityLogs")
    public String securityLogs() {
        return "admin/securityLogs";
    }

    @GetMapping("/backupConfiguration")
    public String backupConfiguration() {
        return "admin/backupConfiguration";
    }

    @GetMapping("/reportScheduling")
    public String reportScheduling() {
        return "admin/reportScheduling";
    }

    @GetMapping("/teamPerformance")
    public String teamPerformance() {
        return "admin/teamPerformance";
    }

    @GetMapping("/teamCollaborationMonitor")
    public String teamCollaborationMonitor() {
        return "admin/teamCollaborationMonitor";
    }

    @GetMapping("/notificationTemplates")
    public String notificationTemplates() {
        return "admin/notificationTemplates";
    }

    @GetMapping("/globalTaskCategories")
    public String globalTaskCategories() {
        return "admin/globalTaskCategories";
    }

    @GetMapping("/priorityLevels")
    public String priorityLevels() {
        return "admin/priorityLevels";
    }

    @GetMapping("/securitySettings")
    public String securitySettings() {
        return "admin/securitySettings";
    }

    @GetMapping("/passwordPolicies")
    public String passwordPolicies() {
        return "admin/passwordPolicies";
    }
}


