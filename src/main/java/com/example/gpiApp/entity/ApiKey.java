package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A machine credential for the public API. Only the SHA-256 hash of the key is stored; the plaintext
 * is shown to the creator exactly once. A request presenting a valid key is authenticated as the
 * key's creator, so it inherits that user's organization and permissions (and dies if they're removed).
 */
@Data
@Entity
@Table(name = "api_keys", indexes = { @Index(name = "idx_api_keys_hash", columnList = "key_hash", unique = true) })
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    /** SHA-256 hex of the full key (the only stored form). */
    @Column(name = "key_hash", nullable = false, unique = true, length = 80)
    private String keyHash;

    /** Non-secret display prefix, e.g. "gpi_live_a1b2…". */
    @Column(name = "key_prefix", length = 40)
    private String keyPrefix;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private allUsers createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
