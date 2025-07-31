package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class TaskRequestDTO {
    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 200, message = "Task title must be between 3 and 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private UUID projectId;
    private UUID categoryId;
    private UUID priorityId;

    @NotNull(message = "Task type is required")
    private TaskType taskType;

    private TaskStatus status = TaskStatus.DRAFT;
    private DifficultyLevel difficultyLevel;

    @Min(value = 0, message = "Estimated hours cannot be negative")
    private Integer estimatedHours;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dueDate;

    private List<UUID> assignedToUserIds;
}

