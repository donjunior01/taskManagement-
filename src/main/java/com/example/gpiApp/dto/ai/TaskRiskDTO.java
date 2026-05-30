package com.example.gpiApp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Predicted delivery risk for a single open task.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRiskDTO {

    private Long taskId;
    private String taskName;
    private String assignedToName;

    private String deadline;       // ISO date, may be null
    private Integer progress;      // 0-100

    /** LOW / MEDIUM / HIGH / CRITICAL. */
    private String riskLevel;

    /** Predicted number of days the task will finish past its deadline (0 if on time). */
    private int predictedSlipDays;

    /** Predicted completion date (ISO), or null when no progress trend is available. */
    private String predictedCompletionDate;

    /** Human-readable explanation of the prediction. */
    private String reason;
}
