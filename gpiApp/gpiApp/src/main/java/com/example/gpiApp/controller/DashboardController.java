package com.example.gpiApp.controller;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.Date;
import java.util.UUID;

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {
    
    private final TaskService taskService;
    private final UserRepository userRepository;

//    @GetMapping("/admin/adminDashboard")
//    public String adminDashboardLegacy() { return "redirect:/admin/dashboard"; }
//
//    @GetMapping("/project-manager/pmDashboard")
//    public String projectManagerDashboardLegacy() { return "redirect:/project-manager/dashboard"; }
//
//    @GetMapping("/user/userDashboard")
//    public String userDashboardLegacy() { return "redirect:/user/dashboard"; }
    
    @GetMapping("/api/dashboard/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // Using the new service methods
            long totalTasks = taskService.getTotalTasksCount();
            long completedTasks = taskService.getCompletedTasksCount();
            long activeTasks = taskService.getActiveTasksCount();
            long overdueTasks = taskService.getOverdueTasksCount();
            
            statistics.put("totalTasks", totalTasks);
            statistics.put("completedTasks", completedTasks);
            statistics.put("inProgressTasks", activeTasks);
            statistics.put("overdueTasks", overdueTasks);
            
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            // Return demo data if service fails
            statistics.put("totalTasks", 25);
            statistics.put("completedTasks", 15);
            statistics.put("inProgressTasks", 8);
            statistics.put("overdueTasks", 2);
            return ResponseEntity.ok(statistics);
        }
    }
    
    @GetMapping("/api/dashboard/performance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getPerformanceData() {
        Map<String, Object> performance = new HashMap<>();
        
        // Demo performance data
        performance.put("labels", List.of("Jan", "Feb", "Mar", "Apr", "May", "Jun"));
        performance.put("completedTasks", List.of(12, 19, 15, 25, 22, 30));
        performance.put("overdueTasks", List.of(2, 3, 1, 4, 2, 1));
        
        return ResponseEntity.ok(performance);
    }
    
    @GetMapping("/api/dashboard/recent-activity")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getRecentActivity() {
        try {
            List<TaskDTO> recentTasks = taskService.getAllTasks();
            return ResponseEntity.ok(recentTasks.subList(0, Math.min(recentTasks.size(), 5)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of()); // Return empty list if service fails
        }
    }

    // Admin Dashboard Endpoints
    @GetMapping("/api/dashboard/admin/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long totalUsers = userRepository.count();
            long totalTasks = taskService.getTotalTasksCount();
            long completedTasks = taskService.getCompletedTasksCount();
            long activeTasks = taskService.getActiveTasksCount();
            long overdueTasks = taskService.getOverdueTasksCount();
            
            stats.put("totalUsers", totalUsers);
            stats.put("totalTasks", totalTasks);
            stats.put("completedTasks", completedTasks);
            stats.put("activeTasks", activeTasks);
            stats.put("overdueTasks", overdueTasks);
            stats.put("completionRate", totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // Return demo data if service fails
            stats.put("totalUsers", 25);
            stats.put("totalTasks", 150);
            stats.put("completedTasks", 120);
            stats.put("activeTasks", 25);
            stats.put("overdueTasks", 5);
            stats.put("completionRate", 80.0);
            return ResponseEntity.ok(stats);
        }
    }

    @GetMapping("/api/dashboard/admin/tasks")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getAdminTasks() {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks.subList(0, Math.min(tasks.size(), 10)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/dashboard/admin/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminUsers() {
        try {
            List<allUsers> users = userRepository.findAll();
            List<Map<String, Object>> userData = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("userId", user.getUserId());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());
                    userMap.put("email", user.getEmail());
                    userMap.put("userRole", user.getUserRole());
                    userMap.put("isActive", user.getIsActive());
                    return userMap;
                })
                .toList();
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/dashboard/admin/reports")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminReports() {
        List<Map<String, Object>> reports = new ArrayList<>();
        
        // Demo reports data
        reports.add(createDemoReport("Task Completion Report", "TASK_REPORT", "COMPLETED", "John Admin"));
        reports.add(createDemoReport("User Performance Report", "PERFORMANCE_REPORT", "IN_PROGRESS", "Sarah Manager"));
        reports.add(createDemoReport("System Health Report", "SYSTEM_REPORT", "PENDING", "Michael Lead"));
        reports.add(createDemoReport("Team Productivity Report", "USER_REPORT", "COMPLETED", "Emma Designer"));
        
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/api/dashboard/admin/team-performance")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTeamPerformance() {
        Map<String, Object> performance = new HashMap<>();
        
        // Demo team performance data
        performance.put("teams", List.of(
            Map.of("teamId", 1L, "teamName", "Development Team A", "productivity", 85.5, "completedTasks", 45, "overdueTasks", 2),
            Map.of("teamId", 2L, "teamName", "Design Team", "productivity", 92.3, "completedTasks", 38, "overdueTasks", 1)
        ));
        
        performance.put("chartData", Map.of(
            "labels", List.of("Jan", "Feb", "Mar", "Apr", "May", "Jun"),
            "productivity", List.of(75, 82, 78, 85, 88, 92),
            "completedTasks", List.of(30, 35, 32, 40, 42, 45)
        ));
        
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/api/dashboard/admin/projects")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminProjects() {
        List<Map<String, Object>> projects = new ArrayList<>();
        
        // Demo projects data
        projects.add(createDemoProject("E-Commerce Platform", "ACTIVE", 75.0, "Development Team A"));
        projects.add(createDemoProject("Mobile App Redesign", "ACTIVE", 60.0, "Design Team"));
        projects.add(createDemoProject("API Gateway", "PLANNING", 0.0, "Development Team A"));
        
        return ResponseEntity.ok(projects);
    }

    // Project Manager Dashboard Endpoints
    @GetMapping("/api/dashboard/manager/stats")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getManagerStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Demo manager stats
        stats.put("teamMembers", 8);
        stats.put("assignedTasks", 25);
        stats.put("completedTasks", 18);
        stats.put("overdueTasks", 2);
        stats.put("teamProductivity", 85.5);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/api/dashboard/manager/tasks")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TaskDTO>> getManagerTasks() {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks.subList(0, Math.min(tasks.size(), 8)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/dashboard/manager/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getManagerTeam() {
        List<Map<String, Object>> team = new ArrayList<>();
        
        // Demo team data
        team.add(createDemoTeamMember("Alice Developer", "DEVELOPER", 85.0, 12));
        team.add(createDemoTeamMember("Bob Coder", "DEVELOPER", 78.0, 8));
        team.add(createDemoTeamMember("Emma Designer", "UI_UX_DESIGNER", 92.0, 15));
        
        return ResponseEntity.ok(team);
    }

    @GetMapping("/api/dashboard/manager/team-tasks")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TaskDTO>> getManagerTeamTasks() {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks.subList(0, Math.min(tasks.size(), 15)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/dashboard/manager/analytics")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getManagerAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Demo analytics data
        analytics.put("taskCompletion", Map.of(
            "labels", List.of("Mon", "Tue", "Wed", "Thu", "Fri"),
            "completed", List.of(5, 8, 6, 9, 7),
            "assigned", List.of(8, 10, 7, 12, 9)
        ));
        
        analytics.put("teamPerformance", Map.of(
            "labels", List.of("Alice", "Bob", "Emma", "David"),
            "productivity", List.of(85, 78, 92, 80),
            "tasksCompleted", List.of(12, 8, 15, 10)
        ));
        
        return ResponseEntity.ok(analytics);
    }

    // User Dashboard Endpoints
    @GetMapping("/api/dashboard/user/stats")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Demo user stats
        stats.put("assignedTasks", 8);
        stats.put("completedTasks", 6);
        stats.put("overdueTasks", 1);
        stats.put("productivity", 87.5);
        stats.put("weeklyPlanning", "COMPLIANT");
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/api/dashboard/user/tasks")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TaskDTO>> getUserTasks() {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks.subList(0, Math.min(tasks.size(), 5)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // Helper methods for demo data
    private Map<String, Object> createDemoReport(String name, String type, String status, String generatedBy) {
        Map<String, Object> report = new HashMap<>();
        report.put("reportId", UUID.randomUUID().toString());
        report.put("name", name);
        report.put("type", type);
        report.put("status", status);
        report.put("generatedBy", generatedBy);
        report.put("generatedDate", new Date());
        return report;
    }

    private Map<String, Object> createDemoProject(String name, String status, double progress, String team) {
        Map<String, Object> project = new HashMap<>();
        project.put("projectId", UUID.randomUUID().toString());
        project.put("name", name);
        project.put("status", status);
        project.put("progress", progress);
        project.put("team", team);
        project.put("startDate", new Date());
        project.put("endDate", new Date(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000));
        return project;
    }

    private Map<String, Object> createDemoTeamMember(String name, String role, double productivity, int tasksCompleted) {
        Map<String, Object> member = new HashMap<>();
        member.put("name", name);
        member.put("role", role);
        member.put("productivity", productivity);
        member.put("tasksCompleted", tasksCompleted);
        member.put("isActive", true);
        return member;
    }
}