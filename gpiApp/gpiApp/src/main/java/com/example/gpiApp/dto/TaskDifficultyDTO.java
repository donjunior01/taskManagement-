package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDifficultyDTO {
    private UUID difficultyId;
    private UUID taskId;
    private String taskTitle;
    private UUID reportedById;
    private String reportedByName;
    private String difficultyDescription;
    private TaskDifficulty.ImpactLevel impactLevel;
    private TaskDifficulty.CriticalityLevel criticalityLevel;
    private String suggestedSolution;
    private Boolean isResolved;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
} 