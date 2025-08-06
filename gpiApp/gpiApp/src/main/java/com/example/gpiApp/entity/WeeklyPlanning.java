package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "weekly_plannings")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyPlanning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "planning_id")
    private Long planningId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "week_end_date", nullable = false)
    private LocalDate weekEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "compliance_status", nullable = false)
    private ComplianceStatus complianceStatus;

    @Column(name = "total_tasks_planned", nullable = false)
    private Integer totalTasksPlanned;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private allUsers approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "planning", cascade = CascadeType.ALL)
    private List<DailyTaskSchedule> dailyTaskSchedules;

    public enum ComplianceStatus {
        COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
