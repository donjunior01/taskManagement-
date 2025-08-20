package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.dto.AdminDashboardStatsDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.dto.MessageDTO;
import com.example.gpiApp.dto.TaskAssignmentDTO;
import com.example.gpiApp.dto.CalendarEventDTO;
import com.example.gpiApp.dto.TimeTrackingDTO;
import com.example.gpiApp.dto.CollaborationDTO;
import com.example.gpiApp.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
public class DashboardDataController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CalendarService calendarService;

    @Autowired
    private TimeTrackingService timeTrackingService;

    @Autowired
    private CollaborationService collaborationService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    // Get current user
    @GetMapping("/auth/current-user")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            UserDTO user = userService.getUserByUsername(username);
            if (user != null) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // Admin Dashboard Stats
    @GetMapping("/admin/dashboard-stats")
    public ResponseEntity<AdminDashboardStatsDTO> getAdminDashboardStats() {
        try {
            AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Manager Dashboard Stats
    @GetMapping("/manager/dashboard-stats")
    public ResponseEntity<DashboardStatsDTO> getManagerDashboardStats() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            DashboardStatsDTO stats = new DashboardStatsDTO();
            stats.setTotalTasks(taskService.getTasksCountByManager(username));
            stats.setActiveTasks(taskService.getActiveTasksCountByManager(username));
            stats.setCompletedTasks(taskService.getCompletedTasksCountByManager(username));
            stats.setOverdueTasks(taskService.getOverdueTasksCountByManager(username));
            stats.setTotalProjects(projectService.getProjectsCountByManager(username));
            
            // Add chart data
            Map<String, Object> chartData = new HashMap<>();
            chartData.put("teamPerformance", taskService.getTeamPerformanceData(username));
            chartData.put("projectProgress", projectService.getProjectProgressByManager(username));
            stats.setChartData(chartData);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // User Dashboard Stats
    @GetMapping("/user/dashboard-stats")
    public ResponseEntity<DashboardStatsDTO> getUserDashboardStats() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            DashboardStatsDTO stats = new DashboardStatsDTO();
            stats.setTotalTasks(taskService.getTasksCountByUser(username));
            stats.setActiveTasks(taskService.getActiveTasksCountByUser(username));
            stats.setCompletedTasks(taskService.getCompletedTasksCountByUser(username));
            stats.setOverdueTasks(taskService.getOverdueTasksCountByUser(username));
            
            // Add chart data
            Map<String, Object> chartData = new HashMap<>();
            chartData.put("taskProgress", taskService.getTaskProgressByUser(username));
            chartData.put("timeTracking", timeTrackingService.getTimeTrackingDataByUser(username));
            stats.setChartData(chartData);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Tasks API - do not duplicate (handled by TaskController)

    // Projects API - removed to avoid conflict with ProjectController

    // Users API - removed to avoid conflict with UserController

    // Notifications API
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<NotificationDTO> notifications = notificationService.getNotificationsByUser(username);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            boolean deleted = notificationService.deleteNotification(id, username);
            if (deleted) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Messages/Assignments/Teams/Deliverables APIs removed to avoid duplicates

    // Calendar Events API - removed to avoid conflict with CalendarController

    // Time Tracking API
    @GetMapping("/time-tracking")
    public ResponseEntity<TimeTrackingDTO> getTimeTrackingData() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            TimeTrackingDTO timeData = timeTrackingService.getTimeTrackingDataByUser(username);
            return ResponseEntity.ok(timeData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Collaboration API
    @GetMapping("/collaboration")
    public ResponseEntity<CollaborationDTO> getCollaborationData() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            CollaborationDTO collaborationData = collaborationService.getCollaborationDataByUser(username);
            return ResponseEntity.ok(collaborationData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Reports API
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            String role = userService.getUserRole(username);
            
            Map<String, Object> reports = new HashMap<>();
            
            if ("ADMIN".equals(role)) {
                reports.put("systemReports", taskService.getSystemReports());
                reports.put("userReports", userService.getUserReports());
                reports.put("projectReports", projectService.getProjectReports());
            } else if ("MANAGER".equals(role)) {
                reports.put("teamReports", taskService.getTeamReports(username));
                reports.put("projectReports", projectService.getProjectReportsByManager(username));
            } else {
                reports.put("personalReports", taskService.getPersonalReports(username));
            }
            
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
