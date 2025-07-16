package com.example.gpiApp.controller;


import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Optional;

@Controller
@RequestMapping("/")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/admin/adminDashboard")
    public String adminDashboard(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/api/auth/login";
        }

        Optional<allUsers> currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser.isEmpty()) {
            return "redirect:/api/auth/login";
        }

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

        allUsers currentAllUsers = currentUserOpt.get();


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

        allUsers currentAllUsers = currentUserOpt.get();


        return "user/userDashboard";
    }
  }