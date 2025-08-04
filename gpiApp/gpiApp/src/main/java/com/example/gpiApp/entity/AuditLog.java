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
@Table(name = "audit_logs")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "log_id")
    private UUID logId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private allUsers user;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "table_name", nullable = false)
    private String tableName;

    @Column(name = "record_id")
    private UUID recordId;

    @Column(name = "old_values", columnDefinition = "JSON")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "action_timestamp", nullable = false)
    private LocalDateTime actionTimestamp;

    @PrePersist
    protected void onCreate() {
        actionTimestamp = LocalDateTime.now();
    }
} 