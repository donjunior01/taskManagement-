package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.NotificationService;
import com.example.gpiApp.service.ProjectService;
import com.example.gpiApp.service.TaskService;
import com.example.gpiApp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/user")
public class UserPageController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/userDashboard")
    public String userDashboard(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<NotificationDTO> notifications = notificationService.getNotificationsByUser(username);
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("notifications", notifications);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("notifications", List.of());
            model.addAttribute("error", "Failed to load dashboard data: " + e.getMessage());
        }
        return "user/userDashboard";
    }

    @GetMapping("/tasks")
    public String tasks(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load tasks: " + e.getMessage());
        }
        return "user/tasks";
    }

    @GetMapping("/create-task")
    public String createTask(Model model) {
        try {
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load task creation data: " + e.getMessage());
        }
        return "user/createTask";
    }

    @GetMapping("/edit-task/{taskId}")
    public String editTask(@PathVariable("taskId") Long taskId, Model model) {
        try {
            TaskDTO task = taskService.getTaskById(taskId);
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            
            model.addAttribute("task", task);
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("task", null);
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load task for editing: " + e.getMessage());
        }
        return "user/editTask";
    }

    @GetMapping("/task-details/{taskId}")
    public String taskDetails(@PathVariable("taskId") Long taskId, Model model) {
        try {
            TaskDTO task = taskService.getTaskById(taskId);
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            
            model.addAttribute("task", task);
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("task", null);
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load task details: " + e.getMessage());
        }
        return "user/taskDetails";
    }

    @GetMapping("/task-complete/{taskId}")
    public String taskComplete(@PathVariable("taskId") Long taskId, Model model) {
        try {
            TaskDTO task = taskService.getTaskById(taskId);
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("task", task);
            model.addAttribute("projects", projects);
        } catch (Exception e) {
            model.addAttribute("task", null);
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load task completion data: " + e.getMessage());
        }
        return "user/taskComplete";
    }

    @GetMapping("/calendar")
    public String calendar(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load calendar data: " + e.getMessage());
        }
        return "user/calendar";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load profile data: " + e.getMessage());
        }
        return "user/profile";
    }

    @GetMapping("/collaboration")
    public String collaboration(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<TaskDTO> tasks = taskService.getAllTasks();
            
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
            model.addAttribute("tasks", tasks);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("error", "Failed to load collaboration data: " + e.getMessage());
        }
        return "user/collaboration";
    }

    @GetMapping("/time-tracking")
    public String timeTracking(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load time tracking data: " + e.getMessage());
        }
        return "user/time-tracking";
    }

    @GetMapping("/notifications")
    public String notifications(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<NotificationDTO> notifications = notificationService.getNotificationsByUser(username);
            
            model.addAttribute("notifications", notifications);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("notifications", List.of());
            model.addAttribute("error", "Failed to load notifications: " + e.getMessage());
        }
        return "user/notifications";
    }

    @GetMapping("/notification-settings")
    public String notificationSettings(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<NotificationDTO> notifications = notificationService.getNotificationsByUser(username);
            
            model.addAttribute("notifications", notifications);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("notifications", List.of());
            model.addAttribute("error", "Failed to load notification settings: " + e.getMessage());
        }
        return "user/notificationSettings";
    }

    @GetMapping("/planning-dashboard")
    public String planningDashboard(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load planning dashboard: " + e.getMessage());
        }
        return "user/planningDashboard";
    }

    @GetMapping("/shared-tasks")
    public String sharedTasks(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<UserDTO> users = userService.getAllUsers();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("users", users);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load shared tasks: " + e.getMessage());
        }
        return "user/sharedTasks";
    }

    @GetMapping("/weekly-planning")
    public String weeklyPlanning(Model model) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
            model.addAttribute("username", username);
        } catch (Exception e) {
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load weekly planning: " + e.getMessage());
        }
        return "user/weeklyPlanning";
    }
}
