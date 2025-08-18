package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Project;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private Project.ProjectStatus status;
    private String manager;
    private String createdBy;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer progress;
    private String priority;
    private String category;
} 