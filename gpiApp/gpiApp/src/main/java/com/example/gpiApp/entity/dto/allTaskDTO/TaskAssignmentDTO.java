package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskAssignmentDTO {
    private UUID assignmentId;
    private UUID taskId;
    private String taskTitle;
    private UserSummaryDTO assignedBy;
    private UserSummaryDTO assignedTo;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime assignedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime acceptedAt;

    private AssignmentStatus assignmentStatus;
    private String assignmentNotes;
}


