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
    private String email;
    private String reason;
    private PasswordResetRequest.RequestStatus status;
    private Long userId;
    private String userName;
    private Long processedById;
    private String processedByName;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
}


