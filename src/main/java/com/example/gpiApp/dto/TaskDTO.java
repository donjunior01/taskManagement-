package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Task;
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
public class TaskDTO {
    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToName;
    private Long createdById;
    private String createdByName;
    private Task.TaskPriority priority;
    private Task.TaskDifficulty difficulty;
    private Task.TaskStatus status;
    private Integer progress;
    private LocalDate deadline;
    private Task.ReminderType reminderType;
    private Integer commentCount;
    private Double totalHoursLogged;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

