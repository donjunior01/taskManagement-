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
public class FormController {
    
    private final UserService userService;
    
    public FormController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/user/create-task")
    public String createTaskForm(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "user/createTask";
    }
    
    @GetMapping("/admin/create-user")
    public String createUserForm(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "admin/createUser";
    }
    
    @GetMapping("/pm/create-project")
    public String createProjectForm(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }
        
        String userEmail = authentication.getName();
        Optional<UserDTO> userOpt = userService.getUserByEmail(userEmail);
        if (userOpt.isPresent()) {
            model.addAttribute("user", userOpt.get());
        }
        
        return "project-manager/createProject";
    }
} 