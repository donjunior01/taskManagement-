package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.LoginAttemptDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.SuspiciousIpDTO;
import com.example.gpiApp.service.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    
    @GetMapping("/suspicious-ips")
    public ResponseEntity<ApiResponse<List<SuspiciousIpDTO>>> getSuspiciousIps() {
        return ResponseEntity.ok(ApiResponse.success("Suspicious IPs retrieved",
                loginAttemptService.getSuspiciousIps()));
    }

    @DeleteMapping("/login-attempts/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllLoginAttempts() {
        loginAttemptService.deleteAllLoginAttempts();
        return ResponseEntity.ok(ApiResponse.success("All login attempts deleted", null));
    }

    @GetMapping("/blocked-ips")
    public ResponseEntity<ApiResponse<List<com.example.gpiApp.entity.BlockedIp>>> getBlockedIps() {
        return ResponseEntity.ok(ApiResponse.success("Blocked IPs retrieved", loginAttemptService.getBlockedIps()));
    }

    @PostMapping("/blocked-ips/block")
    public ResponseEntity<ApiResponse<com.example.gpiApp.entity.BlockedIp>> blockIp(@RequestBody Map<String, String> body) {
        try {
            com.example.gpiApp.entity.BlockedIp blocked =
                    loginAttemptService.blockIp(body.get("ipAddress"), body.get("reason"));
            return ResponseEntity.ok(ApiResponse.success("IP address blocked", blocked));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/blocked-ips/unblock")
    public ResponseEntity<ApiResponse<Void>> unblockIp(@RequestBody Map<String, String> body) {
        loginAttemptService.unblockIp(body.get("ipAddress"));
        return ResponseEntity.ok(ApiResponse.success("IP address unblocked", null));
    }
}



