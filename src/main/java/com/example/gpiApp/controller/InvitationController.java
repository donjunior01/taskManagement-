package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.InvitationDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin/manager management of organization invitations (requires user.manage). */
@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('user.manage')")
public class InvitationController {

    private final InvitationService invitationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<InvitationDTO>> list() {
        return ResponseEntity.ok(invitationService.listForCurrentTenant());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvitationDTO>> create(@RequestBody Map<String, String> body, Authentication auth) {
        String inviter = auth != null
                ? userRepository.findByEmail(auth.getName())
                    .map(u -> (u.getFirstName() + " " + u.getLastName()).trim()).orElse(auth.getName())
                : null;
        allUsers.Role role;
        try {
            role = body.get("role") != null ? allUsers.Role.valueOf(body.get("role")) : allUsers.Role.USER;
        } catch (IllegalArgumentException e) {
            role = allUsers.Role.USER;
        }
        InvitationDTO dto = invitationService.create(body.get("email"), role, inviter);
        return ResponseEntity.ok(ApiResponse.success("Invitation created", dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable Long id) {
        invitationService.revoke(id);
        return ResponseEntity.ok(ApiResponse.success("Invitation revoked", null));
    }
}
