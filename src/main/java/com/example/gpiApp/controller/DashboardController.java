package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Optional;

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final DashboardService dashboardService;

    @GetMapping("/admin/adminDashboard")
    public String adminDashboard(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUserOpt = userRepository.findByEmail(authentication.getName());
        if (currentUserOpt.isEmpty()) {
            return "redirect:/api/auth/login";
        }

        allUsers currentUser = currentUserOpt.get();
        DashboardStatsDTO stats = dashboardService.getAdminDashboardStats();
        
        // Add current user to model
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userName", currentUser.getFirstName() + " " + currentUser.getLastName());
        model.addAttribute("userRole", "System Administrator");
        model.addAttribute("userInitials", getInitials(currentUser.getFirstName(), currentUser.getLastName()));
        
        // Add statistics to model
        model.addAttribute("stats", stats);
        model.addAttribute("totalUsers", stats.getTotalUsers());
        model.addAttribute("activeProjects", stats.getActiveProjects());
        model.addAttribute("totalTasks", stats.getTotalTasks());
        model.addAttribute("completedTasks", stats.getCompletedTasks());
        model.addAttribute("overdueTasks", stats.getOverdueTasks());
        model.addAttribute("taskCompletionRate", String.format("%.1f", stats.getTaskCompletionRate() != null ? stats.getTaskCompletionRate() : 0.0));
        model.addAttribute("totalProjects", stats.getTotalProjects());
        model.addAttribute("completedProjects", stats.getCompletedProjects());
        model.addAttribute("onHoldProjects", stats.getOnHoldProjects());
        model.addAttribute("totalTeams", stats.getTotalTeams() != null ? stats.getTotalTeams() : 0);
        
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

        allUsers currentUser = currentUserOpt.get();
        DashboardStatsDTO stats = dashboardService.getManagerDashboardStats(currentUser.getId());
        
        // Add current user to model
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userName", currentUser.getFirstName() + " " + currentUser.getLastName());
        model.addAttribute("userRole", "Project Manager");
        model.addAttribute("userInitials", getInitials(currentUser.getFirstName(), currentUser.getLastName()));
        
        // Add statistics to model with null safety
        model.addAttribute("stats", stats);
        model.addAttribute("totalTasks", stats.getTotalTasks() != null ? stats.getTotalTasks() : 0);
        model.addAttribute("activeTasks", stats.getActiveTasks() != null ? stats.getActiveTasks() : 0);
        model.addAttribute("completedTasks", stats.getCompletedTasks() != null ? stats.getCompletedTasks() : 0);
        model.addAttribute("overdueTasks", stats.getOverdueTasks() != null ? stats.getOverdueTasks() : 0);
        model.addAttribute("taskCompletionRate", String.format("%.1f", stats.getTaskCompletionRate() != null ? stats.getTaskCompletionRate() : 0.0));
        model.addAttribute("teamMembers", stats.getTeamMembers() != null ? stats.getTeamMembers() : 0);

        return "project-manager/pmDashboard";
    }

    @GetMapping("/user/userDashboard")
    public String userDashboard(Authentication authentication, Model model) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUserOpt = userRepository.findByEmail(authentication.getName());
        if (currentUserOpt.isEmpty()) {
            return "redirect:/api/auth/login";
        }

        allUsers currentUser = currentUserOpt.get();
        DashboardStatsDTO stats = dashboardService.getUserDashboardStats(currentUser.getId());
        
        // Add current user to model
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userName", currentUser.getFirstName() + " " + currentUser.getLastName());
        model.addAttribute("userRole", "Employee");
        model.addAttribute("userInitials", getInitials(currentUser.getFirstName(), currentUser.getLastName()));
        
        // Add statistics to model with null safety
        model.addAttribute("stats", stats);
        model.addAttribute("activeTasks", stats.getActiveTasks() != null ? stats.getActiveTasks() : 0);
        model.addAttribute("completedTasks", stats.getCompletedTasks() != null ? stats.getCompletedTasks() : 0);
        model.addAttribute("overdueTasks", stats.getOverdueTasks() != null ? stats.getOverdueTasks() : 0);
        model.addAttribute("taskCompletionRate", String.format("%.1f", stats.getTaskCompletionRate() != null ? stats.getTaskCompletionRate() : 0.0));

        return "user/userDashboard";
    }
    
    private String getInitials(String firstName, String lastName) {
        String initials = "";
        if (firstName != null && !firstName.isEmpty()) {
            initials += firstName.charAt(0);
        }
        if (lastName != null && !lastName.isEmpty()) {
            initials += lastName.charAt(0);
        }
        return initials.toUpperCase();
    }
}