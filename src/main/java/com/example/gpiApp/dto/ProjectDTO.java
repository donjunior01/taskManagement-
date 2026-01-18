package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Project;
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
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private Long managerId;
    private String managerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Project.ProjectStatus status;
    private Integer progress;
    private Integer taskCount;
    private Integer teamCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

