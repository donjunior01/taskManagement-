package com.example.gpiApp.dto;

import com.example.gpiApp.entity.LoginAttempt;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttemptDTO {
    private Long id;
    private Long userId;
    private String username;
    private String ipAddress;
    private LoginAttempt.LoginStatus status;
    private LocalDateTime attemptedAt;
    private String reason;
}
