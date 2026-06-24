package com.example.gpiApp.dto;

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
    private String device;
    private String ipAddress;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeenAt;
    private boolean current;   // true for the device making the request
}
