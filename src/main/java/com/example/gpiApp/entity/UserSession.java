package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A server-side record of an issued session, keyed by the JWT's {@code jti} claim. Lets us revoke a
 * specific token (logout a device, "sign out everywhere", admin force-logout) even though the JWT
 * itself is stateless — the request filter rejects any token whose session is revoked or missing.
 */
@Data
@Entity
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_user_sessions_session_id", columnList = "session_id"),
        @Index(name = "idx_user_sessions_user_id", columnList = "user_id")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The JWT id (jti) this session backs — unique per issued token. */
    @Column(name = "session_id", nullable = false, unique = true, length = 64)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "device")
    private String device;            // User-Agent (truncated)

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (lastSeenAt == null) lastSeenAt = createdAt;
    }
}
