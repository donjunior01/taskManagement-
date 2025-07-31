package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskResponseDTO {
    private UUID taskId;
    private String title;
    private String description;
    private UserSummaryDTO createdBy;
    private ProjectSummaryDTO project;
    private TaskCategoryDTO category;
    private TaskPriorityDTO priority;
    private TaskType taskType;
    private TaskStatus status;
    private DifficultyLevel difficultyLevel;
    private Integer estimatedHours;
    private Integer actualHours;
    private BigDecimal progressPercentage;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    private List<TaskAssignmentDTO> assignments;
    private List<CommentDTO> comments;
    private List<TaskFileDTO> files;
    private List<TaskProgressDTO> progressHistory;
    private List<TaskDifficultyDTO> difficulties;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    private Boolean isOverdue;
    private Integer daysUntilDue;
    private TaskStatsDTO stats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class TaskStatsDTO {
        private Integer totalComments;
        private Integer totalFiles;
        private Integer totalAssignments;
        private Integer completionRate;
        private Integer timeSpentHours;
        private Integer timeRemainingHours;
    }
}

