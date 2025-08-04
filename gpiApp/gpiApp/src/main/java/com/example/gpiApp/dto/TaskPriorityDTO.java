package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskPriorityDTO {
    private UUID priorityId;
    private String priorityName;
    private Integer priorityLevel;
    private String colorCode;
    private Boolean isActive;
} 