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
public class ApiKeyDTO {
    private Long id;
    private String name;
    private String keyPrefix;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private boolean revoked;
    /** Only populated on creation — the full plaintext key, shown exactly once. */
    private String plaintextKey;
}
