package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferencesDTO {
    
    private Long id;
    private Long userId;
    private String userName;
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean taskDeadlineReminders;
    private Boolean taskAssignmentNotifications;
    private Boolean projectUpdateNotifications;
    private Boolean commentNotifications;
    private Boolean messageNotifications;
    private Integer deadlineReminderHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
