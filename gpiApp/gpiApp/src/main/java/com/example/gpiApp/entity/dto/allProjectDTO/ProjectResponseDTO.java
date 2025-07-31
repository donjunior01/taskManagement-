package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectResponseDTO {
    private UUID projectId;
    private String projectName;
    private String description;
    private TeamSummaryDTO team;
    private ProjectStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date endDate;

    private List<TaskSummaryDTO> tasks;
    private ProjectStatsDTO stats;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class ProjectStatsDTO {
        private Integer totalTasks;
        private Integer completedTasks;
        private Integer inProgressTasks;
        private Integer overdueTasks;
        private Double progressPercentage;
        private Integer daysRemaining;
        private Double budgetUtilization;
    }
}