package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.InvitationDTO;
import com.example.gpiApp.entity.Invitation;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.InvitationRepository;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** Creates, lists, revokes and accepts organization invitations. */
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SystemSettingsService systemSettingsService;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    /** Create an invite for the current tenant; emails it (best-effort) and returns the accept link. */
    @Transactional
    public InvitationDTO create(String email, allUsers.Role role, String inviterName) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Email is required.");
        if (userRepository.existsByEmail(email.trim())) {
            throw new IllegalArgumentException("A user with this email already exists.");
        }
        String token = "inv_" + UUID.randomUUID().toString().replace("-", "");
        Invitation inv = Invitation.builder()
                .email(email.trim())
                .token(token)
                .role(role != null ? role : allUsers.Role.USER)
                .invitedByName(inviterName)
                .build();
        inv = invitationRepository.save(inv); // TenantListener stamps the inviting admin's organization
        String acceptUrl = frontendUrl + "/accept-invite?token=" + token;
        String orgName = orgName(inv.getOrganizationId());
        try { emailService.sendInvitationEmail(inv.getEmail(), orgName, inviterName, acceptUrl); } catch (Exception ignore) { }

        InvitationDTO dto = toDTO(inv);
        dto.setAcceptUrl(acceptUrl);
        dto.setOrganizationName(orgName);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<InvitationDTO> listForCurrentTenant() {
        Long org = TenantContext.getOrganizationId();
        List<Invitation> list = org != null
                ? invitationRepository.findByOrganizationIdOrderByCreatedAtDesc(org)
                : invitationRepository.findAll();
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public void revoke(Long id) {
        Invitation inv = invitationRepository.findById(id).orElseThrow(() -> new AccessDeniedException("Invitation not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && inv.getOrganizationId() != null && !org.equals(inv.getOrganizationId())) {
            throw new AccessDeniedException("This invitation belongs to another organization.");
        }
        invitationRepository.delete(inv);
    }

    /** Public lookup for the accept page — returns org name + target email, and whether it's still valid. */
    @Transactional(readOnly = true)
    public InvitationDTO lookup(String token) {
        Invitation inv = invitationRepository.findByToken(token).orElse(null);
        if (inv == null) return InvitationDTO.builder().valid(false).build();
        boolean valid = !inv.isAccepted() && inv.getExpiresAt() != null && inv.getExpiresAt().isAfter(LocalDateTime.now());
        return InvitationDTO.builder()
                .email(inv.getEmail())
                .role(inv.getRole().name())
                .organizationName(orgName(inv.getOrganizationId()))
                .expiresAt(inv.getExpiresAt())
                .accepted(inv.isAccepted())
                .valid(valid)
                .build();
    }

    /** Public accept — creates the user in the invitation's organization with the invited role. */
    @Transactional
    public void accept(String token, String username, String firstName, String lastName, String password) {
        Invitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation link."));
        if (inv.isAccepted()) throw new IllegalArgumentException("This invitation has already been used.");
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This invitation has expired.");
        }
        if (userRepository.existsByEmail(inv.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        String policyError = systemSettingsService.validatePassword(password);
        if (policyError != null) throw new IllegalArgumentException(policyError);

        String finalUsername = username != null && !username.isBlank() ? username.trim() : inv.getEmail();
        if (userRepository.existsByUsername(finalUsername)) {
            throw new IllegalArgumentException("That username is already taken.");
        }

        allUsers user = new allUsers();
        user.setEmail(inv.getEmail());
        user.setUsername(finalUsername);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPassword(passwordEncoder.encode(password));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setRole(inv.getRole());
        user.setActive(true);
        organizationRepository.findById(inv.getOrganizationId()).ifPresent(user::setOrganization);
        userRepository.save(user);

        inv.setAccepted(true);
        invitationRepository.save(inv);
    }

    private String orgName(Long orgId) {
        return orgId == null ? "" : organizationRepository.findById(orgId).map(Organization::getName).orElse("");
    }

    private InvitationDTO toDTO(Invitation i) {
        return InvitationDTO.builder()
                .id(i.getId()).email(i.getEmail()).role(i.getRole().name())
                .invitedByName(i.getInvitedByName()).createdAt(i.getCreatedAt()).expiresAt(i.getExpiresAt())
                .accepted(i.isAccepted())
                .valid(!i.isAccepted() && i.getExpiresAt() != null && i.getExpiresAt().isAfter(LocalDateTime.now()))
                .build();
    }
}
