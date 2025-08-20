package com.example.gpiApp.controller.view;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.NotificationService;
import com.example.gpiApp.service.CollaborationService;
import com.example.gpiApp.service.CalendarService;
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

import java.util.List;

@Controller
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserPageController {

    private final TaskService taskService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final CollaborationService collaborationService;
    private final CalendarService calendarService;

    @GetMapping("/userDashboard")
    public String userDashboard(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("tasks", taskService.getTasksByUser(username));
        return "user/userDashboard";
    }

    @GetMapping("/tasks")
    public String tasks(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        model.addAttribute("tasks", taskService.getTasksByUser(username));
        return "user/tasks";
    }

    @GetMapping("/create-task")
    public String createTask(Model model) {
        addTopbarData(model, getUsername());
        return "user/createTask";
    }

    @GetMapping("/edit-task/{taskId}")
    public String editTask(@PathVariable("taskId") Long taskId, Model model) {
        addTopbarData(model, getUsername());
        model.addAttribute("task", taskService.getTaskById(taskId));
        return "user/editTask";
    }

    @GetMapping("/task-details/{taskId}")
    public String taskDetails(@PathVariable("taskId") Long taskId, Model model) {
        addTopbarData(model, getUsername());
        model.addAttribute("task", taskService.getTaskById(taskId));
        return "user/taskDetails";
    }

    @GetMapping("/task-complete/{taskId}")
    public String taskComplete(@PathVariable("taskId") Long taskId, Model model) {
        addTopbarData(model, getUsername());
        model.addAttribute("task", taskService.getTaskById(taskId));
        return "user/taskComplete";
    }

    @GetMapping("/calendar")
    public String calendar(Model model) {
        addTopbarData(model, getUsername());
        model.addAttribute("events", calendarService.getEventsByUser(getUsername()));
        return "user/calendar";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        addTopbarData(model, getUsername());
        return "user/profile";
    }

    @GetMapping("/collaboration")
    public String collaboration(Model model) {
        addTopbarData(model, getUsername());
        return "user/collaboration";
    }

    @GetMapping("/time-tracking")
    public String timeTracking(Model model) {
        addTopbarData(model, getUsername());
        return "user/time-tracking";
    }

    @GetMapping("/notifications")
    public String notifications(Model model) {
        String username = getUsername();
        addTopbarData(model, username);
        return "user/notifications";
    }

    @GetMapping("/notification-settings")
    public String notificationSettings(Model model) {
        addTopbarData(model, getUsername());
        return "user/notificationSettings";
    }

    @GetMapping("/planning-dashboard")
    public String planningDashboard(Model model) {
        addTopbarData(model, getUsername());
        return "user/planningDashboard";
    }

    @GetMapping("/shared-tasks")
    public String sharedTasks(Model model) {
        addTopbarData(model, getUsername());
        return "user/sharedTasks";
    }

    @GetMapping("/weekly-planning")
    public String weeklyPlanning(Model model) {
        addTopbarData(model, getUsername());
        return "user/weeklyPlanning";
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
