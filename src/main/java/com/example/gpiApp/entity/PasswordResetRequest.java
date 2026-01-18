package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "password_reset_requests")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "reset_token", nullable = false, unique = true)
    @Builder.Default
    private String resetToken = UUID.randomUUID().toString();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResetStatus status = ResetStatus.PENDING;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "reset_at")
    private LocalDateTime resetAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_reviewed_by")
    private allUsers reviewedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    public enum ResetStatus {
        PENDING,
        APPROVED,
        REJECTED,
        RESET_COMPLETED,
        EXPIRED
    }

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
        expiresAt = LocalDateTime.now().plusHours(24); // Token expires in 24 hours
    }
}
