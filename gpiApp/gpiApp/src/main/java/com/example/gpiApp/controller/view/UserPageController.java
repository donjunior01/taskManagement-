package com.example.gpiApp.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/user")
public class UserPageController {

    @GetMapping("/userDashboard")
    public String userDashboard() {
        return "user/userDashboard";
    }

    @GetMapping("/tasks")
    public String tasks() {
        return "user/tasks";
    }

    @GetMapping("/create-task")
    public String createTask() {
        return "user/createTask";
    }

    @GetMapping("/edit-task/{taskId}")
    public String editTask(@PathVariable("taskId") Long taskId) {
        return "user/editTask";
    }

    @GetMapping("/task-details/{taskId}")
    public String taskDetails(@PathVariable("taskId") Long taskId) {
        return "user/taskDetails";
    }

    @GetMapping("/task-complete/{taskId}")
    public String taskComplete(@PathVariable("taskId") Long taskId) {
        return "user/taskComplete";
    }

    @GetMapping("/calendar")
    public String calendar() {
        return "user/calendar";
    }

    @GetMapping("/profile")
    public String profile() {
        return "user/profile";
    }

    @GetMapping("/collaboration")
    public String collaboration() {
        return "user/collaboration";
    }

    @GetMapping("/time-tracking")
    public String timeTracking() {
        return "user/time-tracking";
    }

    @GetMapping("/notifications")
    public String notifications() {
        return "user/notifications";
    }

    @GetMapping("/notification-settings")
    public String notificationSettings() {
        return "user/notificationSettings";
    }

    @GetMapping("/planning-dashboard")
    public String planningDashboard() {
        return "user/planningDashboard";
    }

    @GetMapping("/shared-tasks")
    public String sharedTasks() {
        return "user/sharedTasks";
    }

    @GetMapping("/weekly-planning")
    public String weeklyPlanning() {
        return "user/weeklyPlanning";
    }
}
