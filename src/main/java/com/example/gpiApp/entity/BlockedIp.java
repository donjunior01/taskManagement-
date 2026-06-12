package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** An IP address blocked by an admin from the security console. Logins from it are refused. */
@Entity
@Table(name = "blocked_ips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, unique = true)
    private String ipAddress;

    @Column(name = "reason")
    private String reason;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @PrePersist
    protected void onCreate() {
        if (blockedAt == null) blockedAt = LocalDateTime.now();
    }
}
