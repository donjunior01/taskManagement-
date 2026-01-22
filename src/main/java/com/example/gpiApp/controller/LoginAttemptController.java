package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.LoginAttemptDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.service.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
public class LoginAttemptController {
    
    private final LoginAttemptService loginAttemptService;
    
    @GetMapping("/login-attempts")
    public ResponseEntity<PagedResponse<LoginAttemptDTO>> getLoginAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(loginAttemptService.getAllLoginAttempts(page, size));
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityMetrics() {
        Map<String, Object> metrics = loginAttemptService.getSecurityMetrics();
        return ResponseEntity.ok(ApiResponse.success("Security metrics retrieved", metrics));
    }
    
    @DeleteMapping("/login-attempts/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllLoginAttempts() {
        loginAttemptService.deleteAllLoginAttempts();
        return ResponseEntity.ok(ApiResponse.success("All login attempts deleted", null));
    }
}



