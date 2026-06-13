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
}
