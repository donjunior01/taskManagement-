package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics and metrics")
public class DashboardApiController {
    
    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get admin dashboard stats", description = "Retrieve comprehensive system statistics for administrators")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved stats"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
    })
    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getAdminDashboardStats() {
        DashboardStatsDTO stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
    
    @Operation(summary = "Get manager dashboard stats", description = "Retrieve project and team statistics for project managers")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved stats"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Manager role required")
    })
    @GetMapping("/manager/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getManagerDashboardStats(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        DashboardStatsDTO stats = dashboardService.getManagerDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
    
    @Operation(summary = "Get user dashboard stats", description = "Retrieve personal task statistics for regular users")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved stats"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

