package com.example.gpiApp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private String createdBy;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long projectId;
    private String projectName;
    private Integer progress;
    private String difficulty;
} 