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
    private String username;
    private String email;
    private LoginAttempt.LoginStatus status;
    private String ipAddress;
    private String userAgent;
    private String reason;
    private LocalDateTime attemptedAt;
    private Long userId;
    private String userName;
}



