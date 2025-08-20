package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.AdminDashboardStatsDTO;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.AdminDashboardService;
import com.example.gpiApp.service.ProjectService;
import com.example.gpiApp.service.TaskService;
import com.example.gpiApp.service.UserService;
import com.example.gpiApp.service.NotificationService;
import com.example.gpiApp.service.CollaborationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminPageController {

    private final AdminDashboardService adminDashboardService;
    private final UserService userService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final CollaborationService collaborationService;

    @GetMapping("/adminDashboard")
    public String adminDashboard(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        
        AdminDashboardStatsDTO stats;
        try {
            stats = adminDashboardService.getDashboardStats();
        } catch (Exception e) {
            stats = AdminDashboardStatsDTO.builder()
                    .totalUsers(0L).totalProjects(0L).totalTasks(0L)
                    .activeTasks(0L).completedTasks(0L).overdueTasks(0L)
                    .systemUptime(0.0)
                    .build();
        }
        model.addAttribute("dashboardStats", stats);
        model.addAttribute("recentUsers", userService.getAllUsers());
        model.addAttribute("projects", projectService.getAllProjects());
        model.addAttribute("tasks", taskService.getAllTasks());
        return "admin/adminDashboard";
    }

    @GetMapping("/userManagement")
    public String userManagement(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("users", userService.getAllUsers());
        return "admin/userManagement";
    }

    @GetMapping("/createUser")
    public String createUser(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("roles", List.of("SUPER_ADMIN","MANAGER","EMPLOYEE"));
        return "admin/createUser";
    }

    @GetMapping("/rolesAndPermissions")
    public String rolesPermissions(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("roles", List.of("SUPER_ADMIN","MANAGER","EMPLOYEE"));
        return "admin/rolesAndPermissions";
    }

    @GetMapping("/projectManagement")
    public String projectManagement(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("projects", projectService.getAllProjects());
        return "admin/projectManagement";
    }

    @GetMapping("/globalTasks")
    public String globalTasks(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("tasks", taskService.getAllTasks());
        return "admin/globalTasks";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("users", userService.getAllUsers());
        model.addAttribute("tasks", taskService.getAllTasks());
        return "admin/teamAssignment";
    }

    @GetMapping("/globalReports")
    public String globalReports(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("reports", Map.of(
                "systemReports", Map.of(),
                "projectReports", Map.of(),
                "userReports", userService.getUserReports()
        ));
        return "admin/globalReports";
    }

    @GetMapping("/activityLogs")
    public String activityLogs(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("logs", List.of());
        return "admin/activityLogs";
    }

    @GetMapping("/systemSettings")
    public String systemSettings(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("settings", Map.of());
        return "admin/systemSettings";
    }

    @GetMapping("/integrations")
    public String integrations(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("integrations", List.of());
        return "admin/integration";
    }

    @GetMapping("/securityAndBackups")
    public String securityBackups(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("backups", List.of());
        return "admin/securityAndBackups";
    }

    @GetMapping("/support")
    public String supportCenter(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("faqs", List.of());
        return "admin/supportCenter";
    }

    // Additional admin pages
    @GetMapping("/emailIntegration")
    public String emailIntegration(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("config", Map.of());
        return "admin/emailIntegration";
    }

    @GetMapping("/calendarIntegration")
    public String calendarIntegration(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("config", Map.of());
        return "admin/calendarIntegration";
    }

    @GetMapping("/externalIntegrations")
    public String externalIntegrations(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("integrations", List.of());
        return "admin/externalIntegrations";
    }

    @GetMapping("/systemHealth")
    public String systemHealth(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("health", Map.of());
        return "admin/systemHealth";
    }

    @GetMapping("/securityLogs")
    public String securityLogs(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("logs", List.of());
        return "admin/securityLogs";
    }

    @GetMapping("/backupConfiguration")
    public String backupConfiguration(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("config", Map.of());
        return "admin/backupConfiguration";
    }

    @GetMapping("/reportScheduling")
    public String reportScheduling(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("schedules", List.of());
        return "admin/reportScheduling";
    }

    @GetMapping("/teamPerformance")
    public String teamPerformance(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("teams", List.of());
        return "admin/teamPerformance";
    }

    @GetMapping("/teamCollaborationMonitor")
    public String teamCollaborationMonitor(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("collaboration", List.of());
        return "admin/teamCollaborationMonitor";
    }

    @GetMapping("/notificationTemplates")
    public String notificationTemplates(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("templates", List.of());
        return "admin/notificationTemplates";
    }

    @GetMapping("/globalTaskCategories")
    public String globalTaskCategories(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("categories", List.of());
        return "admin/globalTaskCategories";
    }

    @GetMapping("/priorityLevels")
    public String priorityLevels(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("levels", List.of("LOW","MEDIUM","HIGH","URGENT"));
        return "admin/priorityLevels";
    }

    @GetMapping("/securitySettings")
    public String securitySettings(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("settings", Map.of());
        return "admin/securitySettings";
    }

    @GetMapping("/passwordPolicies")
    public String passwordPolicies(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("policies", List.of());
        return "admin/passwordPolicies";
    }

    private String getUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }

    private void addTopbarData(Model model, String username) {
        if (username == null) return;
        UserDTO current = userService.getUserByUsername(username);
        if (current != null) {
            model.addAttribute("user", current);
        }
        model.addAttribute("notifications", notificationService.getNotificationsByUser(username));
        model.addAttribute("messages", collaborationService.getMessagesByUser(username));
    }
}


