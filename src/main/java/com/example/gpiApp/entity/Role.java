package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * An admin-defined custom role, scoped to one organization. Holds a set of permission keys (from the
 * {@code Permission} catalog). A user with a custom role uses exactly its permissions; users without
 * one fall back to their base-role defaults. Tenant-owned so each org manages its own roles.
 */
@Data
@Entity
@Table(name = "roles")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Built-in roles that ship with the system (not deletable). */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean system = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Column(name = "permission", length = 80)
    @Builder.Default
    private Set<String> permissions = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
