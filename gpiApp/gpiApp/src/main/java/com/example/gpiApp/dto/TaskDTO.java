package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private UUID taskId;
    private String title;
    private String description;
    private UUID createdById;
    private String createdByName;
    private UUID projectId;
    private String projectName;
    private UUID categoryId;
    private String categoryName;
    private UUID priorityId;
    private String priorityName;
    private Task.TaskType taskType;
    private Task.TaskStatus status;
    private Task.DifficultyLevel difficultyLevel;
    private Integer estimatedHours;
    private Integer actualHours;
    private BigDecimal progressPercentage;
    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TaskAssignmentDTO> assignments;
    private List<CommentDTO> comments;
    private List<TaskFileDTO> files;
    private List<TaskProgressDTO> progressHistory;
    private List<TaskDifficultyDTO> difficulties;
    private Integer commentCount;
    private Integer fileCount;
    private Integer assignmentCount;
} 