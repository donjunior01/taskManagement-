package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "login_attempts")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stamped from the attempted email's organization (TenantContext isn't set during login). */
    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "username")
    private String username; // Can be null if attempt is before authentication
    
    @Column(name = "email")
    private String email; // The email attempted to log in with

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginStatus status;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private allUsers user;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @Column(name = "reason")
    private String reason; // e.g., "Bad credentials", "Account locked"

    @PrePersist
    protected void onCreate() {
        attemptedAt = LocalDateTime.now();
    }

    public enum LoginStatus {
        SUCCESS,
        FAILURE
    }
}

