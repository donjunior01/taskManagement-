package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskProgressDTO {
    private Long progressId;
    private Long taskId;
    private String taskTitle;
    private Long updatedById;
    private String updatedByName;
    private BigDecimal previousPercentage;
    private BigDecimal currentPercentage;
    private String progressNotes;
    private LocalDateTime updatedAt;
} 