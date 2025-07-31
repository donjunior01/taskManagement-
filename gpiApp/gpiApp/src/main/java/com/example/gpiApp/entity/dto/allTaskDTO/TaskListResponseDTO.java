package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskListResponseDTO {
    private List<TaskSummaryDTO> tasks;
    private PaginationInfo pagination;
    private TaskFilterInfo filters;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class TaskSummaryDTO {
        private UUID taskId;
        private String title;
        private String description;
        private String createdByName;
        private String projectName;
        private String categoryName;
        private String priorityName;
        private TaskType taskType;
        private TaskStatus status;
        private DifficultyLevel difficultyLevel;
        private BigDecimal progressPercentage;
        private Date dueDate;
        private Boolean isOverdue;
        private Integer assignedUsersCount;
        private String priorityColor;
        private String categoryColor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class TaskFilterInfo {
        private TaskStatus status;
        private TaskType taskType;
        private DifficultyLevel difficultyLevel;
        private UUID projectId;
        private UUID categoryId;
        private UUID priorityId;
        private UUID assignedToUserId;
        private Boolean isOverdue;
        private String searchTerm;
        private String sortBy;
        private String sortDirection;
    }
}
