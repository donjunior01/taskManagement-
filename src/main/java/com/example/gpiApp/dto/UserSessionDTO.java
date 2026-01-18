package com.example.gpiApp.dto;

import com.example.gpiApp.entity.UserSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionDTO {
    private Long id;
    private Long userId;
    private String username;
    private String ipAddress;
    private String userAgent;
    private String deviceType;
    private LocalDateTime loginTime;
    private LocalDateTime lastActivity;
    private LocalDateTime logoutTime;
    private Boolean isActive;
    private Long durationMinutes;
}
