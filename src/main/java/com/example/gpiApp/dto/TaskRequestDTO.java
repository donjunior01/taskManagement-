package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Task;
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
public class TaskRequestDTO {
    @NotBlank(message = "Task name is required")
    private String name;
    
    private String description;
    
    private Long projectId;
    
    private Long assignedToId;
    
    private Task.TaskPriority priority;
    
    private Task.TaskDifficulty difficulty;
    
    private Task.TaskStatus status;
    
    private Integer progress;
    
    private LocalDate deadline;
    
    private Task.ReminderType reminderType;
}

