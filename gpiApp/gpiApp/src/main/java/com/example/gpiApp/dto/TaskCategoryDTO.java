package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCategoryDTO {
    private Long categoryId;
    private String categoryName;
    private String description;
    private String colorCode;
    private Boolean isActive;
} 