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
@Table(name = "user_performance_metrics")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPerformanceMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "metric_id")
    private UUID metricId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "tasks_completed", nullable = false)
    private int tasksCompleted = 0;

    @Column(name = "tasks_overdue", nullable = false)
    private int tasksOverdue = 0;

    @Column(name = "average_completion_time_hours", precision = 5, scale = 2)
    private BigDecimal averageCompletionTimeHours;

    @Column(name = "planning_compliance_rate", precision = 5, scale = 2)
    private BigDecimal planningComplianceRate;

    @Column(name = "satisfaction_score", precision = 3, scale = 2)
    private BigDecimal satisfactionScore;

    @Column(name = "total_tasks_assigned", nullable = false)
    private int totalTasksAssigned = 0;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
} 