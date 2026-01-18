package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class AdminDashboardApiController {
    
    private final DashboardService dashboardService;
    
    @GetMapping("/admin/stats")
    public ResponseEntity<DashboardStatsDTO> getAdminDashboardStats() {
        return ResponseEntity.ok(dashboardService.getAdminDashboardStats());
    }
    
    @GetMapping("/manager/stats")
    public ResponseEntity<DashboardStatsDTO> getManagerDashboardStats(Authentication authentication) {
        // Get current user ID from authentication
        // This is simplified - in production, get the actual user ID
        Long managerId = 1L; // Placeholder
        return ResponseEntity.ok(dashboardService.getManagerDashboardStats(managerId));
    }
    
    @GetMapping("/user/stats")
    public ResponseEntity<DashboardStatsDTO> getUserDashboardStats(Authentication authentication) {
        // Get current user ID from authentication
        // This is simplified - in production, get the actual user ID
        Long userId = 1L; // Placeholder
        return ResponseEntity.ok(dashboardService.getUserDashboardStats(userId));
    }
}
