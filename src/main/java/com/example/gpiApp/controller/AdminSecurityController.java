package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.service.impl.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
public class AdminSecurityController {
    
    private final SecurityService securityService;
    
    @GetMapping("/login-attempts")
    public ResponseEntity<PagedResponse<LoginAttemptDTO>> getLoginAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(securityService.getLoginAttempts(page, size));
    }
    
    @GetMapping("/failed-login-attempts")
    public ResponseEntity<PagedResponse<LoginAttemptDTO>> getFailedLoginAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(securityService.getFailedLoginAttempts(page, size));
    }
    
    @GetMapping("/active-sessions")
    public ResponseEntity<PagedResponse<UserSessionDTO>> getActiveSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(securityService.getAllActiveSessions(page, size));
    }
    
    @GetMapping("/active-sessions/count")
    public ResponseEntity<Long> getActiveSessionCount() {
        return ResponseEntity.ok(securityService.getActiveSessionCount());
    }
    
    @GetMapping("/security-alerts")
    public ResponseEntity<PagedResponse<SecurityAlertDTO>> getSecurityAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(securityService.getAllSecurityAlerts(page, size));
    }
    
    @GetMapping("/security-alerts/unresolved")
    public ResponseEntity<PagedResponse<SecurityAlertDTO>> getUnresolvedAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(securityService.getUnresolvedAlerts(page, size));
    }
    
    @GetMapping("/security-alerts/count")
    public ResponseEntity<Long> getUnresolvedAlertCount() {
        return ResponseEntity.ok(securityService.getUnresolvedAlertCount());
    }
    
    @PostMapping("/security-alerts/{alertId}/resolve")
    public ResponseEntity<Void> resolveSecurityAlert(@PathVariable Long alertId) {
        securityService.resolveSecurityAlert(alertId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<SecurityMetricsDTO> getSecurityMetrics() {
        return ResponseEntity.ok(SecurityMetricsDTO.builder()
                .dailyLoginAttempts(0L)
                .failedLoginAttempts(securityService.getTodayFailedLoginCount())
                .activeSessionsCount(securityService.getActiveSessionCount())
                .unresolvedAlertsCount(securityService.getUnresolvedAlertCount())
                .build());
    }
}
