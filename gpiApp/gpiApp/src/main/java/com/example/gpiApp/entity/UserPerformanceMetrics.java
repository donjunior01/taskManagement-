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
@Table(name = "user_performance_metrics")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPerformanceMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metric_id")
    private Long metricId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "tasks_completed", nullable = false)
    private Integer tasksCompleted;

    @Column(name = "tasks_overdue", nullable = false)
    private Integer tasksOverdue;

    @Column(name = "average_completion_time_hours")
    private Double averageCompletionTimeHours;

    @Column(name = "planning_compliance_rate")
    private Double planningComplianceRate;

    @Column(name = "satisfaction_score")
    private Double satisfactionScore;

    @Column(name = "total_tasks_assigned")
    private Integer totalTasksAssigned;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
} 