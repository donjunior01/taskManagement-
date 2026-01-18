package com.example.gpiApp.dto;

import com.example.gpiApp.entity.SecurityAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityAlertDTO {
    private Long id;
    private Long userId;
    private String username;
    private SecurityAlert.AlertType alertType;
    private String description;
    private String ipAddress;
    private SecurityAlert.Severity severity;
    private Boolean isResolved;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
