package com.example.gpiApp.controller;

import com.example.gpiApp.service.UserService;
import com.example.gpiApp.config.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/")
    public String showHomePage() {
        return "index";
    }

    @GetMapping("/login")
    public String showLoginPage(@RequestParam(value = "error", required = false) String error,
                                @RequestParam(value = "logout", required = false) String logout,
                                Model model) {
        if (error != null) {
            model.addAttribute("error", "Invalid username or password");
        }
        if (logout != null) {
            model.addAttribute("message", "You have been logged out successfully");
        }
        return "auth/login";
    }

    @GetMapping("/register")
    public String showRegisterPage() {
        return "auth/register";
    }

    @GetMapping("/logout-confirm")
    public String showLogoutConfirmPage() {
        return "common/logout-confirm";
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

    // Logout - supports both GET and POST methods
    @GetMapping("/logout")
    public String logoutGet(HttpServletRequest request, HttpServletResponse response) {
        return performLogout(request, response);
    }

    @PostMapping("/logout")
    public String logoutPost(HttpServletRequest request, HttpServletResponse response) {
        return performLogout(request, response);
    }

    private String performLogout(HttpServletRequest request, HttpServletResponse response) {
        // Clear the Security Context
        SecurityContextHolder.clearContext();

        // Use Spring Security's logout handler for additional cleanup
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());

        // Clear JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        jwtCookie.setSecure(true); // Use HTTPS in production
        response.addCookie(jwtCookie);

        // Clear any other authentication-related cookies if they exist
        Cookie sessionCookie = new Cookie("JSESSIONID", null);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        response.addCookie(sessionCookie);

        // Redirect to login page with logout parameter
        return "redirect:/api/auth/login?logout=true";
    }
}