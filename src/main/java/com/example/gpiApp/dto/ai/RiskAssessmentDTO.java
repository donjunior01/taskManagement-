package com.example.gpiApp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Predictive delay-risk assessment for a project and its open tasks.
 * <p>
 * Risk levels and predicted slip are computed deterministically from progress velocity and
 * deadline pressure; the narrative {@code summary} can be enriched by the live model. Mirrors
 * the {@code source} MOCK/AI convention used by the rest of the AI assistant.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentDTO {

    private Long projectId;
    private String projectName;

    /** LOW / MEDIUM / HIGH / CRITICAL — the project's overall delivery risk. */
    private String projectRiskLevel;

    /** Short headline describing the project risk. */
    private String headline;

    /** Natural-language assessment (rule-based, optionally AI-enriched). */
    private String summary;

    private int atRiskCount;
    private int totalOpenTasks;

    /** Predicted project completion date (ISO) — the latest predicted task finish, or null. */
    private String predictedProjectCompletion;

    /** Project end date (ISO) for comparison, may be null. */
    private String projectDeadline;

    /** Predicted days the project finishes past its deadline (0 if on time / unknown). */
    private int projectSlipDays;

    /** Per-task risks, ordered most-risky first. */
    private List<TaskRiskDTO> risks;

    private String source;
    private LocalDateTime generatedAt;
}
