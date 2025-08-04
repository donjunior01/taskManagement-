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
public class TaskCategoryDTO {
    private UUID categoryId;
    private String categoryName;
    private String description;
    private String colorCode;
    private Boolean isActive;
} 