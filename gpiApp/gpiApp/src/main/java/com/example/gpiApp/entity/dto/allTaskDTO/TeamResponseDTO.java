package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeamResponseDTO {
    private UUID teamId;
    private String teamName;
    private String description;
    private UserSummaryDTO teamLeader;
    private Boolean isActive;
    private List<UserSummaryDTO> members;
    private List<ProjectSummaryDTO> projects;
    private TeamStatsDTO stats;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class TeamStatsDTO {
        private Integer totalMembers;
        private Integer activeMembers;
        private Integer totalProjects;
        private Integer activeProjects;
        private Integer completedTasks;
        private Integer pendingTasks;
        private Double teamProductivity;
    }
}
