package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class TaskAssignmentRequestDTO {
    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotNull(message = "Assigned to user ID is required")
    private UUID assignedToUserId;

    @Size(max = 500, message = "Assignment notes cannot exceed 500 characters")
    private String assignmentNotes;
}
