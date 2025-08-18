package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.AdminDashboardStatsDTO;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.AdminDashboardService;
import com.example.gpiApp.service.ProjectService;
import com.example.gpiApp.service.TaskService;
import com.example.gpiApp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminPageController {

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private UserService userService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private TaskService taskService;

    @GetMapping("/adminDashboard")
    public String adminDashboard(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            // If there's an error, create default stats
            AdminDashboardStatsDTO defaultStats = AdminDashboardStatsDTO.builder()
                    .totalUsers(0L)
                    .totalProjects(0L)
                    .totalTasks(0L)
                    .activeTasks(0L)
                    .completedTasks(0L)
                    .overdueTasks(0L)
                    .systemUptime(0.0)
                    .build();
            model.addAttribute("dashboardStats", defaultStats);
        }
        return "admin/adminDashboard";
    }

    @GetMapping("/userManagement")
    public String userManagement(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("users", users);
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load users: " + e.getMessage());
        }
        return "admin/userManagement";
    }

    @GetMapping("/createUser")
    public String createUser(Model model) {
        try {
            // Load any necessary data for user creation form
            List<UserDTO> existingUsers = userService.getAllUsers();
            model.addAttribute("existingUsers", existingUsers);
        } catch (Exception e) {
            model.addAttribute("existingUsers", List.of());
        }
        return "admin/createUser";
    }

    @GetMapping("/rolesAndPermissions")
    public String rolesPermissions(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load users: " + e.getMessage());
        }
        return "admin/rolesAndPermissions";
    }

    @GetMapping("/projectManagement")
    public String projectManagement(Model model) {
        try {
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load projects: " + e.getMessage());
        }
        return "admin/projectManagement";
    }

    @GetMapping("/globalTasks")
    public String globalTasks(Model model) {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load tasks: " + e.getMessage());
        }
        return "admin/globalTasks";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load team data: " + e.getMessage());
        }
        return "admin/teamAssignment";
    }

    @GetMapping("/globalReports")
    public String globalReports(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<TaskDTO> tasks = taskService.getAllTasks();
            model.addAttribute("dashboardStats", stats);
            model.addAttribute("projects", projects);
            model.addAttribute("tasks", tasks);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("projects", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("error", "Failed to load reports data: " + e.getMessage());
        }
        return "admin/globalReports";
    }

    @GetMapping("/activityLogs")
    public String activityLogs(Model model) {
        try {
            // Load activity logs data
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load activity logs: " + e.getMessage());
        }
        return "admin/activityLogs";
    }

    @GetMapping("/systemSettings")
    public String systemSettings(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load system settings: " + e.getMessage());
        }
        return "admin/systemSettings";
    }

    @GetMapping("/integrations")
    public String integrations(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load integrations: " + e.getMessage());
        }
        return "admin/integration";
    }

    @GetMapping("/securityAndBackups")
    public String securityBackups(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load security settings: " + e.getMessage());
        }
        return "admin/securityAndBackups";
    }

    @GetMapping("/support")
    public String supportCenter(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load support data: " + e.getMessage());
        }
        return "admin/supportCenter";
    }

    // Additional admin pages to cover full requirements
    @GetMapping("/emailIntegration")
    public String emailIntegration(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load email integration: " + e.getMessage());
        }
        return "admin/emailIntegration";
    }

    @GetMapping("/calendarIntegration")
    public String calendarIntegration(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load calendar integration: " + e.getMessage());
        }
        return "admin/calendarIntegration";
    }

    @GetMapping("/externalIntegrations")
    public String externalIntegrations(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load external integrations: " + e.getMessage());
        }
        return "admin/externalIntegrations";
    }

    @GetMapping("/systemHealth")
    public String systemHealth(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load system health: " + e.getMessage());
        }
        return "admin/systemHealth";
    }

    @GetMapping("/securityLogs")
    public String securityLogs(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load security logs: " + e.getMessage());
        }
        return "admin/securityLogs";
    }

    @GetMapping("/backupConfiguration")
    public String backupConfiguration(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load backup configuration: " + e.getMessage());
        }
        return "admin/backupConfiguration";
    }

    @GetMapping("/reportScheduling")
    public String reportScheduling(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load report scheduling: " + e.getMessage());
        }
        return "admin/reportScheduling";
    }

    @GetMapping("/teamPerformance")
    public String teamPerformance(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load team performance: " + e.getMessage());
        }
        return "admin/teamPerformance";
    }

    @GetMapping("/teamCollaborationMonitor")
    public String teamCollaborationMonitor(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load collaboration monitor: " + e.getMessage());
        }
        return "admin/teamCollaborationMonitor";
    }

    @GetMapping("/notificationTemplates")
    public String notificationTemplates(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load notification templates: " + e.getMessage());
        }
        return "admin/notificationTemplates";
    }

    @GetMapping("/globalTaskCategories")
    public String globalTaskCategories(Model model) {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("tasks", tasks);
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load task categories: " + e.getMessage());
        }
        return "admin/globalTaskCategories";
    }

    @GetMapping("/priorityLevels")
    public String priorityLevels(Model model) {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("tasks", tasks);
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load priority levels: " + e.getMessage());
        }
        return "admin/priorityLevels";
    }

    @GetMapping("/securitySettings")
    public String securitySettings(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load security settings: " + e.getMessage());
        }
        return "admin/securitySettings";
    }

    @GetMapping("/passwordPolicies")
    public String passwordPolicies(Model model) {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            model.addAttribute("dashboardStats", stats);
        } catch (Exception e) {
            model.addAttribute("dashboardStats", AdminDashboardStatsDTO.builder().build());
            model.addAttribute("error", "Failed to load password policies: " + e.getMessage());
        }
        return "admin/passwordPolicies";
    }
}


