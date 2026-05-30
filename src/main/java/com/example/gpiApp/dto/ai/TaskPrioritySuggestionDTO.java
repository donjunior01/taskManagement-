package com.example.gpiApp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single AI suggestion: how a task should be prioritised and why.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskPrioritySuggestionDTO {

    private Long taskId;
    private String taskName;
    private String assignedToName;

    /** The task's current priority (LOW / MEDIUM / HIGH / CRITICAL). */
    private String currentPriority;

    /** The priority the assistant recommends. */
    private String suggestedPriority;

    /** True when the suggested priority differs from the current one. */
    private boolean changeRecommended;

    /** 0-100 composite urgency score driving the suggestion. */
    private int urgencyScore;

    /** Human-readable justification for the suggestion. */
    private String reason;
}
