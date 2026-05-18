package com.example.gpiApp.controller;

import com.example.gpiApp.dto.RegisterRequest;
import com.example.gpiApp.dto.LoginRequest;
import com.example.gpiApp.dto.LoginResponse;
import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserService;
import com.example.gpiApp.config.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String usernameOrEmail = loginRequest.getUsername();
            if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
                usernameOrEmail = loginRequest.getEmail();
            }

            if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Username or email is required"));
            }

            String finalIdentifier = usernameOrEmail;
            allUsers user = userRepository.findByEmail(finalIdentifier)
                    .or(() -> userRepository.findByUsername(finalIdentifier))
                    .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("User not found"));

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtil.generateToken(authentication);

            return ResponseEntity.ok(new LoginResponse(jwt, user));
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        // Check if username already exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username already exists"));
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email already exists"));
        }

        try {
            allUsers user = new allUsers();
            user.setUsername(registerRequest.getUsername());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setEmail(registerRequest.getEmail());
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setRole(allUsers.Role.USER); // Default role

            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("Registration successful! Please sign in.", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Registration failed. Please try again."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
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

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}