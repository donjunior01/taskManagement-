package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.ForgotPasswordRequest;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.PasswordResetRequestDTO;
import com.example.gpiApp.service.impl.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;
    
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<String>> requestPasswordReset(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.requestPasswordReset(request));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<PagedResponse<PasswordResetRequestDTO>> getPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(passwordResetService.getPendingRequests(page, size));
    }
    
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<ApiResponse<String>> approvePasswordReset(
            @PathVariable Long requestId,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(passwordResetService.approvePasswordReset(requestId, adminId));
    }
    
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectPasswordReset(
            @PathVariable Long requestId,
            @RequestParam Long adminId,
            @RequestParam String reason) {
        return ResponseEntity.ok(passwordResetService.rejectPasswordReset(requestId, adminId, reason));
    }
    
    @GetMapping("/pending/count")
    public ResponseEntity<Long> getPendingRequestCount() {
        return ResponseEntity.ok(passwordResetService.getPendingRequestCount());
    }
}
