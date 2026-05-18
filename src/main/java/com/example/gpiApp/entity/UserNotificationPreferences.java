package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferences {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;
    
    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private Boolean emailNotifications = true;
    
    @Column(name = "push_notifications", nullable = false)
    @Builder.Default
    private Boolean pushNotifications = true;
    
    @Column(name = "task_deadline_reminders", nullable = false)
    @Builder.Default
    private Boolean taskDeadlineReminders = true;
    
    @Column(name = "task_assignment_notifications", nullable = false)
    @Builder.Default
    private Boolean taskAssignmentNotifications = true;
    
    @Column(name = "project_update_notifications", nullable = false)
    @Builder.Default
    private Boolean projectUpdateNotifications = true;
    
    @Column(name = "comment_notifications", nullable = false)
    @Builder.Default
    private Boolean commentNotifications = true;
    
    @Column(name = "message_notifications", nullable = false)
    @Builder.Default
    private Boolean messageNotifications = true;
    
    @Column(name = "deadline_reminder_hours", nullable = false)
    @Builder.Default
    private Integer deadlineReminderHours = 24;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
