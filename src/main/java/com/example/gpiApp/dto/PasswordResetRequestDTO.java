package com.example.gpiApp.dto;

import com.example.gpiApp.entity.PasswordResetRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequestDTO {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private PasswordResetRequest.ResetStatus status;
    private String reason;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime expiresAt;
}
