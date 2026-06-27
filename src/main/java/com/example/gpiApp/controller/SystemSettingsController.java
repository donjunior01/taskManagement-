package com.example.gpiApp.controller;

import com.example.gpiApp.dto.SystemSettingsDTO;
import com.example.gpiApp.service.SystemSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Configuration API. Any authenticated user can read settings (so the app
 * can apply the app name / language), while updates are restricted to admins.
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "System Settings", description = "Admin configuration — general & security")
public class SystemSettingsController {

    private final SystemSettingsService settingsService;
    private final com.example.gpiApp.service.EmailService emailService;

    @Operation(summary = "Get system settings")
    @GetMapping
    public ResponseEntity<SystemSettingsDTO> getSettings() {
        return ResponseEntity.ok(settingsService.getSettingsDTO());
    }

    @Operation(summary = "Get public branding (app name, logo, PDF colours)",
            description = "Unauthenticated — used by the login/registration pages and app-wide branding.")
    @GetMapping("/branding")
    public ResponseEntity<com.example.gpiApp.dto.BrandingDTO> getBranding() {
        return ResponseEntity.ok(settingsService.getBranding());
    }

    @Operation(summary = "Get public password policy",
            description = "Unauthenticated — lets the registration page show & validate the password requirements.")
    @GetMapping("/password-policy")
    public ResponseEntity<com.example.gpiApp.dto.PasswordPolicyDTO> getPasswordPolicy() {
        return ResponseEntity.ok(settingsService.getPasswordPolicy());
    }

    @Operation(summary = "Get public registration access policy",
            description = "Unauthenticated — lets the registration page know if sign-up is open and which email domains are allowed.")
    @GetMapping("/registration")
    public ResponseEntity<java.util.Map<String, Object>> getRegistrationPolicy() {
        return ResponseEntity.ok(java.util.Map.of(
                "registrationEnabled", settingsService.isRegistrationEnabled(),
                "allowedDomains", settingsService.getAllowedEmailDomains()));
    }

    @Operation(summary = "Update general settings (admin only)")
    @PutMapping("/general")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<SystemSettingsDTO> updateGeneral(@RequestBody SystemSettingsDTO dto) {
        return ResponseEntity.ok(settingsService.updateGeneral(dto));
    }

    @Operation(summary = "Update security settings (admin only)")
    @PutMapping("/security")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<SystemSettingsDTO> updateSecurity(@RequestBody SystemSettingsDTO dto) {
        return ResponseEntity.ok(settingsService.updateSecurity(dto));
    }

    @Operation(summary = "Update notification settings (admin only)")
    @PutMapping("/notifications")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<SystemSettingsDTO> updateNotifications(@RequestBody SystemSettingsDTO dto) {
        return ResponseEntity.ok(settingsService.updateNotifications(dto));
    }

    @Operation(summary = "Update backup & maintenance settings (admin only)")
    @PutMapping("/backup")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<SystemSettingsDTO> updateBackup(@RequestBody SystemSettingsDTO dto) {
        return ResponseEntity.ok(settingsService.updateBackup(dto));
    }

    @Operation(summary = "Send a test email (admin only)",
            description = "Verifies the configured email provider (Brevo or SMTP) by sending a test message.")
    @PostMapping("/test-email")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<com.example.gpiApp.dto.ApiResponse<String>> sendTestEmail(
            @RequestBody(required = false) java.util.Map<String, String> body,
            org.springframework.security.core.Authentication auth) {
        if (!emailService.isConfigured()) {
            return ResponseEntity.badRequest().body(com.example.gpiApp.dto.ApiResponse.error(
                    "Email is not configured. Set BREVO_API_KEY (Brevo) — or EMAIL_ENABLED=true with SMTP_* — and restart the backend."));
        }
        String to = (body != null && body.get("to") != null && !body.get("to").isBlank())
                ? body.get("to").trim() : (auth != null ? auth.getName() : null);
        if (to == null) {
            return ResponseEntity.badRequest().body(com.example.gpiApp.dto.ApiResponse.error("No recipient address."));
        }
        try {
            emailService.sendTest(to);
            return ResponseEntity.ok(com.example.gpiApp.dto.ApiResponse.success(
                    "Test email sent to " + to + " via " + emailService.activeProvider() + ".", to));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(com.example.gpiApp.dto.ApiResponse.error(
                    "Provider (" + emailService.activeProvider() + ") rejected the email: " + e.getMessage()));
        }
    }
}
