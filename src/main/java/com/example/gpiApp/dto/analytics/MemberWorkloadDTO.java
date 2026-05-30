package com.example.gpiApp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A team member's current workload across the manager's projects.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberWorkloadDTO {
    private String memberName;
    private long openTasks;       // assigned, not yet completed
    private long completedTasks;  // assigned and completed
}
