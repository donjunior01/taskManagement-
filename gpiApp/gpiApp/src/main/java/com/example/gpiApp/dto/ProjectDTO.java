package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private UUID projectId;
    private String projectName;
    private String description;
    private UUID teamId;
    private String teamName;
    private Project.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TaskDTO> tasks;
    private Integer taskCount;
    private Integer completedTaskCount;
    private Integer inProgressTaskCount;
} 