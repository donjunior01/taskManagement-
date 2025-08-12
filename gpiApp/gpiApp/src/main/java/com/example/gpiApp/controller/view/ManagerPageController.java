package com.example.gpiApp.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/project-manager")
public class ManagerPageController {

    @GetMapping("/pmDashboard")
    public String managerDashboard() {
        return "project-manager/pmDashboard";
    }

    @GetMapping("/createProject")
    public String createProject() {
        return "project-manager/createProject";
    }

    @GetMapping("/teamTask")
    public String teamTasks() {
        return "project-manager/teamTask";
    }

    @GetMapping("/teamCommunication")
    public String teamCommunication() {
        return "project-manager/teamCommunication";
    }

    @GetMapping("/teamAssignment")
    public String teamAssignment() {
        return "project-manager/teamAssignment";
    }

    @GetMapping("/reportsAndAnalytics")
    public String reportsAnalytics() {
        return "project-manager/reportsAndAnalytics";
    }

    @GetMapping("/deliverable/{taskId}")
    public String deliverable(@PathVariable("taskId") Long taskId) {
        return "project-manager/deliverable";
    }

    @GetMapping("/nonCompliatUsers")
    public String nonCompliantUsers() {
        return "project-manager/nonCompliatUsers";
    }
}


