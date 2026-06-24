package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TwoFactorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Two-factor (TOTP) enrolment endpoints for the current user. Mounted under /api/2fa
 * (authenticated) — distinct from /api/auth/** which is public.
 */
@RestController
@RequestMapping("/api/2fa")
@RequiredArgsConstructor
@Tag(name = "Two-Factor Auth", description = "TOTP two-factor authentication enrolment")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final UserRepository userRepository;

    @Operation(summary = "Get 2FA status for the current user")
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> status(Authentication authentication) {
        Long userId = currentUserId(authentication);
        boolean enabled = userId != null && twoFactorService.isEnabled(userId);
        return ResponseEntity.ok(ApiResponse.success("Status retrieved", Map.of("enabled", enabled)));
    }

    @Operation(summary = "Begin 2FA setup — returns a secret and otpauth URI")
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<Map<String, String>>> setup(Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success("2FA setup started", twoFactorService.setup(userId)));
    }

    @Operation(summary = "Enable 2FA by verifying the first code; returns one-time recovery codes")
    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enable(@RequestBody Map<String, String> body, Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        java.util.List<String> codes = twoFactorService.enable(userId, body.get("code"));
        return codes != null
                ? ResponseEntity.ok(ApiResponse.success("Two-factor authentication enabled", Map.of("recoveryCodes", codes)))
                : ResponseEntity.badRequest().body(ApiResponse.error("Invalid code — please try again"));
    }

    @Operation(summary = "Regenerate one-time recovery codes (requires a valid code)")
    @PostMapping("/recovery-codes/regenerate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> regenerateRecoveryCodes(@RequestBody Map<String, String> body, Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        java.util.List<String> codes = twoFactorService.regenerateRecoveryCodes(userId, body.get("code"));
        return codes != null
                ? ResponseEntity.ok(ApiResponse.success("Recovery codes regenerated", Map.of("recoveryCodes", codes)))
                : ResponseEntity.badRequest().body(ApiResponse.error("Invalid code — please try again"));
    }

    @Operation(summary = "Disable 2FA (requires a valid code)")
    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<Void>> disable(@RequestBody Map<String, String> body, Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        boolean ok = twoFactorService.disable(userId, body.get("code"));
        return ok ? ResponseEntity.ok(ApiResponse.success("Two-factor authentication disabled", null))
                  : ResponseEntity.badRequest().body(ApiResponse.error("Invalid code — please try again"));
    }

    @Operation(summary = "Admin: reset (clear) a user's 2FA so they can re-enrol")
    @PostMapping("/admin/reset/{userId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminReset(@PathVariable Long userId) {
        twoFactorService.adminReset(userId);
        return ResponseEntity.ok(ApiResponse.success("Two-factor authentication reset for the user", null));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return null;
        String name = authentication.getName();
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(name)
                    .map(allUsers::getId)
                    .orElseGet(() -> userRepository.findByUsername(name).map(allUsers::getId).orElse(null));
        }
    }
}
