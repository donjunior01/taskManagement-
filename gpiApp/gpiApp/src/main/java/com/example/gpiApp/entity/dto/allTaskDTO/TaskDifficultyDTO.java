package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskDifficultyDTO {
    private UUID difficultyId;
    private UUID taskId;
    private UserSummaryDTO reportedBy;
    private String difficultyDescription;
    private ImpactLevel impactLevel;
    private CriticalityLevel criticalityLevel;
    private String suggestedSolution;
    private Boolean isResolved;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp reportedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp resolvedAt;
}