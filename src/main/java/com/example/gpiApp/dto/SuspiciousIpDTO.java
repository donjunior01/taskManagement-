package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspiciousIpDTO {
    private String ipAddress;
    private String country;
    private Long attempts;       // number of failed attempts from this IP
    private LocalDateTime lastAttempt;
    private Long targets;        // distinct usernames targeted
    private String status;       // "Bloquée" | "Surveillée"

    /** Constructor used by the JPQL aggregation query. */
    public SuspiciousIpDTO(String ipAddress, Long attempts, LocalDateTime lastAttempt, Long targets) {
        this.ipAddress = ipAddress;
        this.attempts = attempts;
        this.lastAttempt = lastAttempt;
        this.targets = targets;
    }
}
