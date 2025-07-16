package com.example.gpiApp.controller;

import com.example.gpiApp.repository.UserService;
import com.example.gpiApp.config.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/login")
    public String showLoginPage(@RequestParam(value = "error", required = false) String error, Model model) {
        if (error != null) {
            model.addAttribute("error", "Invalid username or password");
        }
        return "login";
    }

    @GetMapping("/register")
    public String showRegisterPage() {
        return "auth/register";
    }

//    @PostMapping("/register")
//    public String register(@ModelAttribute RegisterRequest registerRequest) {
//        allUsers user = new allUsers();
//        user.setUsername(registerRequest.getUsername());
//        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
//        user.setEmail(registerRequest.getEmail());
//        user.setRole(Role.PROJECT_MANAGER); // Default role
//
//        userService.save(user);
//        return "redirect:/api/auth/login";
//    }

    @GetMapping("/logout")
    public String logout() {
        SecurityContextHolder.clearContext();
        return "redirect:/api/auth/login";
    }
} 