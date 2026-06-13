package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.analytics.AdminReportsDTO;
import com.example.gpiApp.dto.analytics.ManagerAnalyticsDTO;
import com.example.gpiApp.dto.analytics.PerformanceDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.AnalyticsService;
import com.example.gpiApp.service.MetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Advanced analytics endpoints for the project-manager dashboard (CDC Lot 1).
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Advanced project/portfolio analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final MetricsService metricsService;

    @Operation(summary = "Get admin portfolio reports",
            description = "Portfolio-wide KPIs and time series (status over time, burndown, DAU, resolution trend, top performers, team load, tickets) derived from real data.")
    @GetMapping("/admin/reports")
    public ResponseEntity<ApiResponse<AdminReportsDTO>> getAdminReports(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String period) {
        return ResponseEntity.ok(ApiResponse.success("Reports generated", analyticsService.getAdminReports(period)));
    }

    @Operation(summary = "Get live API performance metrics",
            description = "Real request metrics captured by the metrics filter: latency, throughput, error rate, per-minute load, slowest endpoints and recent 5xx errors.")
    @GetMapping("/admin/performance")
    public ResponseEntity<ApiResponse<PerformanceDTO>> getPerformance() {
        return ResponseEntity.ok(ApiResponse.success("Performance metrics", metricsService.snapshot()));
    }

    @Operation(summary = "Get manager portfolio analytics",
            description = "Delivery KPIs, velocity/completion trend, and per-member workload across the manager's projects.")
    @GetMapping("/manager")
    public ResponseEntity<ApiResponse<ManagerAnalyticsDTO>> getManagerAnalytics(Authentication authentication) {
        Long managerId = getCurrentUserId(authentication);
        ManagerAnalyticsDTO analytics = analyticsService.getManagerAnalytics(managerId);
        return ResponseEntity.ok(ApiResponse.success("Analytics generated", analytics));
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            String name = authentication.getName();
            try {
                return Long.parseLong(name);
            } catch (NumberFormatException e) {
                return userRepository.findByEmail(name)
                        .map(allUsers::getId)
                        .orElseGet(() ->
                                userRepository.findByUsername(name)
                                        .map(allUsers::getId)
                                        .orElse(null)
                        );
            }
        }
        return null;
    }
}
