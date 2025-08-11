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

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {
    
    private final TaskService taskService;
    private final UserRepository userRepository;

    @GetMapping("/admin/adminDashboard")
    public String adminDashboardLegacy() { return "redirect:/admin/dashboard"; }

    @GetMapping("/project-manager/pmDashboard")
    public String projectManagerDashboardLegacy() { return "redirect:/project-manager/dashboard"; }

    @GetMapping("/user/userDashboard")
    public String userDashboardLegacy() { return "redirect:/user/dashboard"; }
    
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
}