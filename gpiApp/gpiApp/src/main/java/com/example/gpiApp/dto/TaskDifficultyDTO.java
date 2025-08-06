package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDifficultyDTO {
    private Long difficultyId;
    private Long taskId;
    private String taskTitle;
    private Long reportedById;
    private String reportedByName;
    private String difficultyDescription;
    private TaskDifficulty.ImpactLevel impactLevel;
    private TaskDifficulty.CriticalityLevel criticalityLevel;
    private String suggestedSolution;
    private Boolean isResolved;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
} 