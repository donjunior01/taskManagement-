package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDTO {
    private Long id;
    private String url;
    private String secret;
    private Set<String> events;
    private boolean active;
    private Integer lastStatus;
    private LocalDateTime lastDeliveryAt;
    private LocalDateTime createdAt;
}
