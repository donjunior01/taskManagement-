package com.example.gpiApp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Result of an AI prioritisation pass over a project's open tasks.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrioritizationResultDTO {

    private Long projectId;
    private String projectName;

    /** One-line overall guidance for the manager. */
    private String overallAdvice;

    /** Suggestions ordered by descending urgency score. */
    private List<TaskPrioritySuggestionDTO> suggestions;

    /** "MOCK" while rule-based, "AI" once backed by a live model. */
    private String source;

    private LocalDateTime generatedAt;
}
