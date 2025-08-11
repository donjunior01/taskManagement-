package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "team_performance_metrics")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamPerformanceMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metric_id")
    private Long metricId;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "total_team_members", nullable = false)
    private Integer totalTeamMembers;

    @Column(name = "total_tasks_completed", nullable = false)
    private Integer totalTasksCompleted;

    @Column(name = "total_tasks_overdue", nullable = false)
    private Integer totalTasksOverdue;

    @Column(name = "team_productivity_score")
    private Double teamProductivityScore;

    @Column(name = "average_task_completion_rate")
    private Double averageTaskCompletionRate;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
} 