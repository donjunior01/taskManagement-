package com.example.gpiApp.controller;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Optional;

@Controller
public class DashboardViewController {
    
    private final UserService userService;
    
    public DashboardViewController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/")
    public String index() {
        return "redirect:/login";
    }
    
    @GetMapping("/login")
    public String login() {
        return "auth/login";
    }
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Get current user from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        
        // Load user data
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            UserDTO user = userOpt.get();
            model.addAttribute("user", user);
            
            // Redirect based on user role
            switch (user.getUserRole()) {
                case SUPER_ADMIN:
                    return "redirect:/admin/dashboard";
                case MANAGER:
                    return "redirect:/pm/dashboard";
                case EMPLOYEE:
                default:
                    return "redirect:/user/dashboard";
            }
        }
        
        return "redirect:/login";
    }
    
    @GetMapping("/user/dashboard")
    public String userDashboard(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "user/userDashboard";
    }
    
    @GetMapping("/pm/dashboard")
    public String pmDashboard(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "project-manager/pmDashboard";
    }
    
    @GetMapping("/admin/dashboard")
    public String adminDashboard(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "admin/adminDashboard";
    }
} 