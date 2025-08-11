package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDTO {
    private Long teamId;
    private String teamName;
    private String description;
    private Long teamLeaderId;
    private String teamLeaderName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UserDTO> teamMembers;
    private Integer memberCount;
} 