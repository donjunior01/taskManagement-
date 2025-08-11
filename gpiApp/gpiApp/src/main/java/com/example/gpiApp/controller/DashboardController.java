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

    Random random = new Random();

    @GetMapping("/admin/adminDashboard")
    public String adminDashboard(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser.isEmpty()) {
            return "redirect:/api/auth/login";
        }

        model.addAttribute("user", currentUser.get());

        // Add admin-specific statistics
        model.addAttribute("totalUsers", userRepository.count());
        return "admin/adminDashboard";
    }

    @GetMapping("/project-manager/pmDashboard")
    public String projectManagerDashboard(Authentication authentication, Model model) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUserOpt = userRepository.findByEmail(authentication.getName());
        if (currentUserOpt.isEmpty()) {
            return "redirect:/api/auth/login";
        }

        model.addAttribute("user", currentUserOpt.get());


        return "project-manager/pmDashboard";
    }

    @GetMapping("/user/userDashboard")
    public String userDashboard(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser.isEmpty()) {
            return "redirect:/api/auth/login";
        }

        model.addAttribute("user", currentUser.get());

        // Add admin-specific statistics
        model.addAttribute("totalUsers", userRepository.count());
        return "user/userDashboard";
    }
    
    @GetMapping("/api/dashboard/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        // Get current user ID (in real implementation, get from security context)

        Long currentUserId = random.nextLong(); // TODO: Get from security context
        
        try {
            long totalTasks = taskService.countTasksByUserAndStatus(currentUserId, null);
            long completedTasks = taskService.countTasksByUserAndStatus(currentUserId, 
                com.example.gpiApp.entity.Task.TaskStatus.COMPLETED);
            long inProgressTasks = taskService.countTasksByUserAndStatus(currentUserId, 
                com.example.gpiApp.entity.Task.TaskStatus.IN_PROGRESS);
            long overdueTasks = taskService.countTasksByUserAndStatus(currentUserId, 
                com.example.gpiApp.entity.Task.TaskStatus.ASSIGNED); // Simplified for demo
            
            statistics.put("totalTasks", totalTasks);
            statistics.put("completedTasks", completedTasks);
            statistics.put("inProgressTasks", inProgressTasks);
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
            List<TaskDTO> recentTasks = taskService.getTasksByCreator(random.nextLong());
            return ResponseEntity.ok(recentTasks.subList(0, Math.min(recentTasks.size(), 5)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of()); // Return empty list if service fails
        }
    }

//    all user pages

    @GetMapping("/user/tasks")
    public String TaskPage(Authentication authentication, Model model) {
        return "/user/tasks";
    }
}