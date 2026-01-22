package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeLogDTO {
    private Long id;
    private Long taskId;
    private String taskName;
    private Long userId;
    private String userName;
    private Double hoursSpent;
    private LocalDate logDate;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

