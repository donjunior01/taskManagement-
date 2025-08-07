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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long taskId;
    private String title;
    private String description;
    private Long createdById;
    private String createdByName;
    private Long projectId;
    private String projectName;
    private Long categoryId;
    private String categoryName;
    private Long priorityId;
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