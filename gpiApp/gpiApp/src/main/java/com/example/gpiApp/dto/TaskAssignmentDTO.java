package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskAssignment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentDTO {
    private Long assignmentId;
    private Long taskId;
    private String taskTitle;
    private Long assignedById;
    private String assignedByName;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private TaskAssignment.AssignmentStatus assignmentStatus;
    private String assignmentNotes;
} 