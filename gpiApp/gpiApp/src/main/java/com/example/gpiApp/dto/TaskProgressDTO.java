package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskProgressDTO {
    private UUID progressId;
    private UUID taskId;
    private String taskTitle;
    private UUID updatedById;
    private String updatedByName;
    private BigDecimal previousPercentage;
    private BigDecimal currentPercentage;
    private String progressNotes;
    private LocalDateTime updatedAt;
} 