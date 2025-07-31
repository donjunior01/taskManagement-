package com.example.gpiApp.entity;

@Entity
@Table(name = "user_performance_metrics")
public class userPerformanceMetrics {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "metric_id")
    private UUID metricId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "metric_date")
    private Date metricDate;

    @Column(name = "tasks_completed")
    private Integer tasksCompleted;

    @Column(name = "tasks_overdue")
    private Integer tasksOverdue;

    @Column(name = "average_completion_time_hours")
    private BigDecimal averageCompletionTimeHours;

    @Column(name = "planning_compliance_rate")
    private BigDecimal planningComplianceRate;

    @Column(name = "satisfaction_score")
    private BigDecimal satisfactionScore;

    @Column(name = "total_tasks_assigned")
    private Integer totalTasksAssigned;

    @Column(name = "calculated_at")
    private Timestamp calculatedAt;
}
