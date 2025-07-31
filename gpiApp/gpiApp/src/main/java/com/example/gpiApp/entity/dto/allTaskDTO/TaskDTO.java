package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskDTO {
    private UUID taskId;

    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 200, message = "Task title must be between 3 and 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private UUID createdById;
    private String createdByName;
    private UUID projectId;
    private String projectName;
    private UUID categoryId;
    private String categoryName;
    private UUID priorityId;
    private String priorityName;
    private TaskType taskType;
    private TaskStatus status;
    private DifficultyLevel difficultyLevel;

    @Min(value = 0, message = "Estimated hours cannot be negative")
    private Integer estimatedHours;

    @Min(value = 0, message = "Actual hours cannot be negative")
    private Integer actualHours;

    @DecimalMin(value = "0.0", message = "Progress percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Progress percentage cannot exceed 100")
    private BigDecimal progressPercentage;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    private Boolean isOverdue;
    private Integer daysUntilDue;
}
