package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Project;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRequestDTO {
    @NotBlank(message = "Project name is required")
    private String name;
    
    private String description;
    
    private Long managerId;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Project.ProjectStatus status;
}

