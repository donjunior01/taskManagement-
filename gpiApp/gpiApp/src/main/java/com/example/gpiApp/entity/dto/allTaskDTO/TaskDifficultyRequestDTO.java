package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class TaskDifficultyRequestDTO {
    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotBlank(message = "Difficulty description is required")
    @Size(min = 10, max = 1000, message = "Difficulty description must be between 10 and 1000 characters")
    private String difficultyDescription;

    @NotNull(message = "Impact level is required")
    private ImpactLevel impactLevel;

    @NotNull(message = "Criticality level is required")
    private CriticalityLevel criticalityLevel;

    @Size(max = 1000, message = "Suggested solution cannot exceed 1000 characters")
    private String suggestedSolution;
}
