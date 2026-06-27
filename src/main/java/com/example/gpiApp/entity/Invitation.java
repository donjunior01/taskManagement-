package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * An email invitation to join a specific organization. The token (sent in the invite link) carries
 * the target organization, so the invitee joins THAT tenant — an org is never chosen at a public form.
 * Tenant-owned: created with the inviting admin's organization.
 */
@Data
@Entity
@Table(name = "invitations", indexes = { @Index(name = "idx_invitation_token", columnList = "token", unique = true) })
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private allUsers.Role role;

    @Column(name = "invited_by_name")
    private String invitedByName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean accepted = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = createdAt.plusDays(7);
    }
}
