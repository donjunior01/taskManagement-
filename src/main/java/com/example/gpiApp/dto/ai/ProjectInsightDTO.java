package com.example.gpiApp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI-generated narrative insight for a single project.
 * <p>
 * Today this is produced by {@code AiAssistantService} using a deterministic,
 * rule-based engine over the project's real data. The shape intentionally mirrors
 * what a large-language-model response would return, so the engine can later be
 * swapped for a Claude API call without changing this contract or the frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectInsightDTO {

    private Long projectId;
    private String projectName;

    /** Natural-language, multi-paragraph summary of the project's current state. */
    private String summary;

    /** ON_TRACK, AT_RISK or OFF_TRACK. */
    private String healthStatus;

    /** Short headline describing the health status. */
    private String healthHeadline;

    /** Actionable recommendations, ordered from most to least impactful. */
    private List<String> recommendations;

    /** Key figures surfaced to the user alongside the narrative. */
    private Long totalTasks;
    private Long completedTasks;
    private Long inProgressTasks;
    private Long overdueTasks;
    private Long todoTasks;
    private Double completionRate;
    private Integer daysRemaining;

    /** "MOCK" while rule-based, "AI" once backed by a live model. */
    private String source;

    private LocalDateTime generatedAt;
}
