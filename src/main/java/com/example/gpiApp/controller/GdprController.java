package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.GdprService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * GDPR endpoints. Any authenticated user can export their own data (right of access); erasing a
 * user's personal data (right to be forgotten) requires the user.manage permission and is tenant-scoped.
 */
@RestController
@RequestMapping("/api/gdpr")
@RequiredArgsConstructor
public class GdprController {

    private final GdprService gdprService;
    private final UserRepository userRepository;

    /** Download the authenticated user's personal data as JSON. */
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportMyData(Authentication auth) {
        allUsers me = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Not authenticated"));
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"my-data-export.json\"")
                .body(gdprService.export(me.getId()));
    }

    /** Anonymise a user's PII and deactivate the account (admin-executed erasure). */
    @PostMapping("/erase/{userId}")
    @PreAuthorize("@perm.has('user.manage')")
    public ResponseEntity<ApiResponse<Void>> erase(@PathVariable Long userId) {
        gdprService.anonymize(userId);
        return ResponseEntity.ok(ApiResponse.success("User data anonymised", null));
    }
}
