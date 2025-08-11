package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskPriorityDTO {
    private Long priorityId;
    private String priorityName;
    private Integer priorityLevel;
    private String colorCode;
    private Boolean isActive;
} 