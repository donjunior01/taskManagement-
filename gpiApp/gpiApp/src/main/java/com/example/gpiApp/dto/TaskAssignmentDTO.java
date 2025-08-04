package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskAssignment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentDTO {
    private UUID assignmentId;
    private UUID taskId;
    private String taskTitle;
    private UUID assignedById;
    private String assignedByName;
    private UUID assignedToId;
    private String assignedToName;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private TaskAssignment.AssignmentStatus assignmentStatus;
    private String assignmentNotes;
} 