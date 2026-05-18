package com.example.gpiApp.controller;

import com.example.gpiApp.dto.UserNotificationPreferencesDTO;
import com.example.gpiApp.service.UserNotificationPreferencesService;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.entity.allUsers;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
@Tag(name = "User Notification Preferences", description = "Manage user notification preferences")
public class UserNotificationPreferencesController {

    private final UserNotificationPreferencesService preferencesService;
    private final UserRepository userRepository;

    @Operation(summary = "Get all notification preferences", description = "Retrieve all user notification preferences (admin only)")
    @GetMapping
    public ResponseEntity<List<UserNotificationPreferencesDTO>> getAllPreferences() {
        return ResponseEntity.ok(preferencesService.getAllPreferences());
    }

    @Operation(summary = "Get my notification preferences", description = "Retrieve notification preferences for the current user")
    @GetMapping("/my-preferences")
    public ResponseEntity<UserNotificationPreferencesDTO> getMyPreferences(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(preferencesService.getPreferencesByUserId(userId));
    }

    @Operation(summary = "Get user notification preferences", description = "Retrieve notification preferences for a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<UserNotificationPreferencesDTO> getUserPreferences(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(preferencesService.getPreferencesByUserId(userId));
    }

    @Operation(summary = "Create notification preferences", description = "Create notification preferences for a user")
    @PostMapping
    public ResponseEntity<UserNotificationPreferencesDTO> createPreferences(
            @RequestBody UserNotificationPreferencesDTO request) {
        return ResponseEntity.ok(preferencesService.createPreferences(request));
    }

    @Operation(summary = "Update my notification preferences", description = "Update notification preferences for the current user")
    @PutMapping("/my-preferences")
    public ResponseEntity<UserNotificationPreferencesDTO> updateMyPreferences(
            @RequestBody UserNotificationPreferencesDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(preferencesService.updatePreferences(userId, request));
    }

    @Operation(summary = "Update user notification preferences", description = "Update notification preferences for a specific user")
    @PutMapping("/user/{userId}")
    public ResponseEntity<UserNotificationPreferencesDTO> updateUserPreferences(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @RequestBody UserNotificationPreferencesDTO request) {
        return ResponseEntity.ok(preferencesService.updatePreferences(userId, request));
    }

    @Operation(summary = "Delete my notification preferences", description = "Delete notification preferences for the current user")
    @DeleteMapping("/my-preferences")
    public ResponseEntity<Void> deleteMyPreferences(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        preferencesService.deletePreferences(userId);
        return ResponseEntity.ok().build();
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
