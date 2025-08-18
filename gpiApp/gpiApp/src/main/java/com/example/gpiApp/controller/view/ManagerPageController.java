package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.ProjectService;
import com.example.gpiApp.service.TaskService;
import com.example.gpiApp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/project-manager")
public class ManagerPageController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserService userService;

    @GetMapping("/pmDashboard")
    public String managerDashboard(Model model) {
        try {
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("projects", projects);
            model.addAttribute("tasks", tasks);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("projects", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load dashboard data: " + e.getMessage());
        }
        return "project-manager/pmDashboard";
    }

    @GetMapping("/createProject")
    public String createProject(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> existingProjects = projectService.getAllProjects();
            model.addAttribute("users", users);
            model.addAttribute("existingProjects", existingProjects);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("existingProjects", List.of());
            model.addAttribute("error", "Failed to load project creation data: " + e.getMessage());
        }
        return "project-manager/createProject";
    }

    @GetMapping("/teamTask")
    public String teamTasks(Model model) {
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
            model.addAttribute("error", "Failed to load team tasks: " + e.getMessage());
        }
        return "project-manager/teamTask";
    }

    @GetMapping("/teamCommunication")
    public String teamCommunication(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load team communication data: " + e.getMessage());
        }
        return "project-manager/teamCommunication";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<TaskDTO> tasks = taskService.getAllTasks();
            model.addAttribute("users", users);
            model.addAttribute("projects", projects);
            model.addAttribute("tasks", tasks);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("error", "Failed to load team assignment data: " + e.getMessage());
        }
        return "project-manager/teamAssignment";
    }

    @GetMapping("/reportsAndAnalytics")
    public String reportsAnalytics(Model model) {
        try {
            List<ProjectDTO> projects = projectService.getAllProjects();
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<UserDTO> users = userService.getAllUsers();
            model.addAttribute("projects", projects);
            model.addAttribute("tasks", tasks);
            model.addAttribute("users", users);
        } catch (Exception e) {
            model.addAttribute("projects", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("users", List.of());
            model.addAttribute("error", "Failed to load reports and analytics: " + e.getMessage());
        }
        return "project-manager/reportsAndAnalytics";
    }

    @GetMapping("/deliverable/{taskId}")
    public String deliverable(@PathVariable("taskId") Long taskId, Model model) {
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
            model.addAttribute("error", "Failed to load deliverable data: " + e.getMessage());
        }
        return "project-manager/deliverable";
    }

    @GetMapping("/nonCompliatUsers")
    public String nonCompliantUsers(Model model) {
        try {
            List<UserDTO> users = userService.getAllUsers();
            List<TaskDTO> tasks = taskService.getAllTasks();
            List<ProjectDTO> projects = projectService.getAllProjects();
            model.addAttribute("users", users);
            model.addAttribute("tasks", tasks);
            model.addAttribute("projects", projects);
        } catch (Exception e) {
            model.addAttribute("users", List.of());
            model.addAttribute("tasks", List.of());
            model.addAttribute("projects", List.of());
            model.addAttribute("error", "Failed to load non-compliant users: " + e.getMessage());
        }
        return "project-manager/nonCompliatUsers";
    }
}


