package com.example.gpiApp.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/project-manager")
public class ManagerPageController {

    @GetMapping("/dashboard")
    public String managerDashboard() {
        return "project-manager/pmDashboard";
    }

    @GetMapping("/create-project")
    public String createProject() {
        return "project-manager/createProject";
    }

    @GetMapping("/team-tasks")
    public String teamTasks() {
        return "project-manager/teamTask";
    }

    @GetMapping("/team-communication")
    public String teamCommunication() {
        return "project-manager/teamCommunication";
    }

    @GetMapping("/team-assignment")
    public String teamAssignment() {
        return "project-manager/teamAssignment";
    }

    @GetMapping("/reports-analytics")
    public String reportsAnalytics() {
        return "project-manager/reportsAndAnalytics";
    }

    @GetMapping("/deliverable/{taskId}")
    public String deliverable(@PathVariable("taskId") Long taskId) {
        return "project-manager/deliverable";
    }

    @GetMapping("/non-compliant-users")
    public String nonCompliantUsers() {
        return "project-manager/nonCompliatUsers";
    }
}


