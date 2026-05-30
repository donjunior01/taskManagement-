package com.example.gpiApp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Advanced analytics for a project manager's portfolio: delivery KPIs plus
 * velocity, completion-trend and per-member workload series for the dashboard charts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerAnalyticsDTO {

    private long totalProjects;
    private long totalTasks;
    private long completedTasks;
    private long openTasks;
    private long overdueTasks;
    private long inProgressTasks;
    private long todoTasks;
    private long onHoldTasks;

    /** Percentage of completed (deadline-bearing) tasks finished on or before their deadline. */
    private double onTimeCompletionRate;

    /** Average days from task creation to completion. */
    private double avgCompletionDays;

    /** Tasks completed in the last 28 days. */
    private long velocityLast4Weeks;

    /** Eight-week created/completed series, oldest first. */
    private List<WeeklyPointDTO> weeklyTrend;

    /** Per-member workload, busiest first. */
    private List<MemberWorkloadDTO> workloadByMember;

    private LocalDateTime generatedAt;
}
