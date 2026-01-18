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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private allUsers user;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "ip_address")
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginStatus status;

    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt;

    @Column(columnDefinition = "TEXT")
    private String reason;

    public enum LoginStatus {
        SUCCESS,
        FAILED,
        LOCKED,
        INVALID_CREDENTIALS
    }

    @PrePersist
    protected void onCreate() {
        attemptedAt = LocalDateTime.now();
    }
}
