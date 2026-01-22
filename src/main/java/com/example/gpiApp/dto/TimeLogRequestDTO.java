package com.example.gpiApp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeLogRequestDTO {
    @NotNull(message = "Task ID is required")
    private Long taskId;
    
    @NotNull(message = "Hours spent is required")
    @Positive(message = "Hours spent must be positive")
    private Double hoursSpent;
    
    @NotNull(message = "Log date is required")
    private LocalDate logDate;
    
    private String description;
}

