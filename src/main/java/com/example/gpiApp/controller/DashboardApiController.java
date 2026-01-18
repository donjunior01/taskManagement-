package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
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
public class DashboardApiController {
    
    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    
    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getAdminDashboardStats() {
        DashboardStatsDTO stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
    
    @GetMapping("/manager/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getManagerDashboardStats(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        DashboardStatsDTO stats = dashboardService.getManagerDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
    
    @GetMapping("/user/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getUserDashboardStats(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        DashboardStatsDTO stats = dashboardService.getUserDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}

