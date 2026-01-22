package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "activity_logs")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private ActivityType activityType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private allUsers user;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ActivityType {
        USER_CREATED,
        USER_UPDATED,
        USER_DELETED,
        USER_LOGIN,
        USER_LOGOUT,
        PROJECT_CREATED,
        PROJECT_UPDATED,
        PROJECT_DELETED,
        TASK_CREATED,
        TASK_UPDATED,
        TASK_DELETED,
        TASK_COMPLETED,
        TASK_ASSIGNED,
        TEAM_CREATED,
        TEAM_UPDATED,
        TEAM_DELETED,
        COMMENT_ADDED,
        DELIVERABLE_SUBMITTED,
        DELIVERABLE_REVIEWED,
        TIME_LOGGED,
        MESSAGE_SENT,
        SECURITY_ALERT
    }
}

