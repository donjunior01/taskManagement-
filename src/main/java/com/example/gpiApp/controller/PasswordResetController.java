package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PasswordResetRequestDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
@Tag(name = "Password Reset", description = "Password reset request management")
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Request password reset", description = "Submit a password reset request")
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<PasswordResetRequestDTO>> requestPasswordReset(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Password reset request") @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String reason = request.get("reason");
        return ResponseEntity.ok(passwordResetService.createPasswordResetRequest(email, reason));
    }
    
    @Operation(summary = "Get pending requests", description = "Retrieve all pending password reset requests (Admin only)")
    @GetMapping("/pending")
    public ResponseEntity<List<PasswordResetRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(passwordResetService.getPendingRequests());
    }
    
    @Operation(summary = "Approve password reset", description = "Approve a password reset request (Admin only)")
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<ApiResponse<PasswordResetRequestDTO>> approvePasswordReset(
            @Parameter(description = "Request ID") @PathVariable Long requestId,
            Authentication authentication) {
        Long adminId = getCurrentUserId(authentication);
        return ResponseEntity.ok(passwordResetService.approveRequest(requestId, adminId));
    }
    
    @Operation(summary = "Reject password reset", description = "Reject a password reset request (Admin only)")
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<ApiResponse<PasswordResetRequestDTO>> rejectPasswordReset(
            @Parameter(description = "Request ID") @PathVariable Long requestId,
            Authentication authentication) {
        Long adminId = getCurrentUserId(authentication);
        return ResponseEntity.ok(passwordResetService.rejectRequest(requestId, adminId));
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


