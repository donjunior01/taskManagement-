package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.UserSessionDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.config.security.JwtUtil;
import com.example.gpiApp.service.SessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Active-session management: a user can see their signed-in devices and revoke them ("sign out
 * everywhere"); an admin can force-logout any account. Backed by the revocable JWT session registry.
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Active device / session management")
public class SessionController {

    private final SessionService sessionService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSessionDTO>>> mySessions(Authentication auth, HttpServletRequest request) {
        Long userId = currentUserId(auth);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved",
                sessionService.listForUser(userId, currentSessionId(request))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable Long id, Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        sessionService.revokeOwn(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Session revoked", null));
    }

    @PostMapping("/revoke-others")
    public ResponseEntity<ApiResponse<Void>> revokeOthers(Authentication auth, HttpServletRequest request) {
        Long userId = currentUserId(auth);
        if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
        sessionService.revokeOthers(userId, currentSessionId(request));
        return ResponseEntity.ok(ApiResponse.success("Other sessions revoked", null));
    }

    @PostMapping("/admin/revoke/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminRevokeAll(@PathVariable Long userId) {
        sessionService.revokeAllForUser(userId);
        return ResponseEntity.ok(ApiResponse.success("All sessions revoked for the user", null));
    }

    private String currentSessionId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return jwtUtil.extractSessionId(header.substring(7));
        }
        return null;
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        String name = auth.getName();
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByUsername(name))
                    .map(allUsers::getId)
                    .orElse(null);
        }
    }
}
