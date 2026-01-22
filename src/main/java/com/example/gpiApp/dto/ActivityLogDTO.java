package com.example.gpiApp.dto;

import com.example.gpiApp.entity.ActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogDTO {
    private Long id;
    private ActivityLog.ActivityType activityType;
    private String description;
    private Long userId;
    private String userName;
    private String entityType;
    private Long entityId;
    private String ipAddress;
    private LocalDateTime createdAt;
}

