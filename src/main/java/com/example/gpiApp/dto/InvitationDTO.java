package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationDTO {
    private Long id;
    private String email;
    private String role;
    private String invitedByName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean accepted;
    /** Populated on creation / lookup so the admin can copy the link and the accept page can render. */
    private String acceptUrl;
    private String organizationName;
    private boolean valid;
}
