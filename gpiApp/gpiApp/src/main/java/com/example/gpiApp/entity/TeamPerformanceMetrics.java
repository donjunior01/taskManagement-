package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "team_performance_metrics")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamPerformanceMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "metric_id")
    private UUID metricId;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "total_team_members", nullable = false)
    private int totalTeamMembers = 0;

    @Column(name = "total_tasks_completed", nullable = false)
    private int totalTasksCompleted = 0;

    @Column(name = "total_tasks_overdue", nullable = false)
    private int totalTasksOverdue = 0;

    @Column(name = "team_productivity_score", precision = 5, scale = 2)
    private BigDecimal teamProductivityScore;

    @Column(name = "average_task_completion_rate", precision = 5, scale = 2)
    private BigDecimal averageTaskCompletionRate;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
} 