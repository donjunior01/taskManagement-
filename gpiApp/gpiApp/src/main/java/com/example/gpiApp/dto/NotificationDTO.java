package com.example.gpiApp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String recipient;
    private Boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
