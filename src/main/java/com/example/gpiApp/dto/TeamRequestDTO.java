package com.example.gpiApp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamRequestDTO {
    @NotBlank(message = "Team name is required")
    private String name;
    
    private String description;
    
    private Long projectId;
    
    private Long managerId;
    
    private List<Long> memberIds;
}

