package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.TaskAssignmentRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.NotificationService;
import com.example.gpiApp.service.CollaborationService;
import com.example.gpiApp.service.ProjectService;
import com.example.gpiApp.service.TaskService;
import com.example.gpiApp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/project-manager")
@RequiredArgsConstructor
public class ManagerPageController {

    private final TaskService taskService;
    private final ProjectService projectService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final CollaborationService collaborationService;

    @GetMapping("/pmDashboard")
    public String managerDashboard(Model model) {
        String username = getUsername();
        addTopbarData(model, username);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", taskService.getTasksCountByManager(username));
        stats.put("activeTasks", taskService.getActiveTasksCountByManager(username));
        stats.put("completedTasks", taskService.getCompletedTasksCountByManager(username));
        stats.put("overdueTasks", taskService.getOverdueTasksCountByManager(username));
        stats.put("totalProjects", projectService.getProjectsCountByManager(username));
        model.addAttribute("dashboardStats", stats);

        // Team members (employees only)
        List<allUsers> employees = userRepository.findActiveUsersByRole(allUsers.UserRole.EMPLOYEE);
        model.addAttribute("employees", employees);

        // Recent tasks (simple: all tasks created by manager)
        List<TaskDTO> tasks = taskService.getTasksByManager(username);
        model.addAttribute("recentTasks", tasks);

        // Notifications for topbar
        model.addAttribute("notifications", notificationService.getNotificationsByUser(username));

        return "project-manager/pmDashboard";
    }

    @GetMapping("/createProject")
    public String createProject(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        return "project-manager/createProject";
    }

    @GetMapping("/teamTask")
    public String teamTasks(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("tasks", taskService.getTasksByManager(username));
        model.addAttribute("employees", userRepository.findActiveUsersByRole(allUsers.UserRole.EMPLOYEE));
        model.addAttribute("projects", projectService.getAllProjects());
        return "project-manager/teamTask";
    }

    @GetMapping("/teamCommunication")
    public String teamCommunication(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        // Messages can be built from comments (kept for client fetch too)
        model.addAttribute("notifications", notificationService.getNotificationsByUser(username));
        return "project-manager/teamCommunication";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("employees", userRepository.findActiveUsersByRole(allUsers.UserRole.EMPLOYEE));
        model.addAttribute("projects", projectService.getAllProjects());
        model.addAttribute("tasks", taskService.getTasksByManager(username));
        model.addAttribute("assignments", taskAssignmentRepository.findAll());
        return "project-manager/teamAssignment";
    }

    @GetMapping("/reportsAndAnalytics")
    public String reportsAnalytics(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        Map<String, Object> reports = new HashMap<>();
        reports.put("teamReports", taskService.getTeamReports(username));
        reports.put("projectReports", projectService.getProjectReportsByManager(username));
        model.addAttribute("reports", reports);
        return "project-manager/reportsAndAnalytics";
    }

    @GetMapping("/deliverable/{taskId}")
    public String deliverable(@PathVariable("taskId") Long taskId, Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("task", taskService.getTaskById(taskId));
        return "project-manager/deliverable";
    }

    @GetMapping("/nonCompliatUsers")
    public String nonCompliantUsers(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("users", userService.getAllUsers());
        return "project-manager/nonCompliatUsers";
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


 