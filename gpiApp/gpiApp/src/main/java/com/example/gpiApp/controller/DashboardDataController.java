package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.NotificationDTO;
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
    public ResponseEntity<DashboardStatsDTO> getAdminDashboardStats() {
        try {
            DashboardStatsDTO stats = new DashboardStatsDTO();
            stats.setTotalTasks(taskService.getTotalTasksCount());
            stats.setActiveTasks(taskService.getActiveTasksCount());
            stats.setCompletedTasks(taskService.getCompletedTasksCount());
            stats.setOverdueTasks(taskService.getOverdueTasksCount());
            stats.setTotalUsers(userService.getTotalUsersCount());
            stats.setTotalProjects(projectService.getTotalProjectsCount());
            
            // Add chart data
            Map<String, Object> chartData = new HashMap<>();
            chartData.put("taskStatusDistribution", taskService.getTaskStatusDistribution());
            chartData.put("projectProgress", projectService.getProjectProgressData());
            chartData.put("userActivity", userService.getUserActivityData());
            stats.setChartData(chartData);
            
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

    // Tasks API - Removed duplicate endpoints (handled by TaskController)
    // @GetMapping("/tasks") - REMOVED
    // @GetMapping("/tasks/{id}") - REMOVED
    // @PostMapping("/tasks") - REMOVED
    // @PutMapping("/tasks/{id}") - REMOVED
    // @DeleteMapping("/tasks/{id}") - REMOVED

    // Projects API (Admin only)
    @GetMapping("/admin/projects")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            List<ProjectDTO> projects = projectService.getAllProjects();
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/admin/projects/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            ProjectDTO project = projectService.getProjectById(id);
            if (project != null) {
                return ResponseEntity.ok(project);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/admin/projects")
    public ResponseEntity<ProjectDTO> createProject(@RequestBody ProjectDTO projectDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            ProjectDTO createdProject = projectService.createProject(projectDTO);
            return ResponseEntity.ok(createdProject);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/admin/projects/{id}")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @RequestBody ProjectDTO projectDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            projectDTO.setId(id);
            ProjectDTO updatedProject = projectService.updateProject(projectDTO);
            if (updatedProject != null) {
                return ResponseEntity.ok(updatedProject);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/admin/projects/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            boolean deleted = projectService.deleteProject(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Users API (Admin only)
    @GetMapping("/admin/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            List<UserDTO> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/admin/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            UserDTO user = userService.getUserById(id);
            if (user != null) {
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/admin/users")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            UserDTO createdUser = userService.createUser(userDTO);
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            userDTO.setId(id);
            UserDTO updatedUser = userService.updateUser(userDTO);
            if (updatedUser != null) {
                return ResponseEntity.ok(updatedUser);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String role = userService.getUserRole(auth.getName());
            
            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            boolean deleted = userService.deleteUser(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

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

    // Calendar Events API
    @GetMapping("/calendar/events")
    public ResponseEntity<List<CalendarEventDTO>> getCalendarEvents() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            List<CalendarEventDTO> events = calendarService.getEventsByUser(username);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

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
