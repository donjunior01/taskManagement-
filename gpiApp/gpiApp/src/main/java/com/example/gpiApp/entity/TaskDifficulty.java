package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "task_difficulties")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDifficulty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "difficulty_id")
    private Long difficultyId;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne
    @JoinColumn(name = "reported_by", nullable = false)
    private allUsers reportedBy;

    @Column(name = "difficulty_description", columnDefinition = "TEXT", nullable = false)
    private String difficultyDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "impact_level", nullable = false)
    private ImpactLevel impactLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "criticality_level", nullable = false)
    private CriticalityLevel criticalityLevel;

    @Column(name = "suggested_solution", columnDefinition = "TEXT")
    private String suggestedSolution;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum ImpactLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum CriticalityLevel {
        MINOR, IMPORTANT, URGENT, CRITICAL
    }

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
    }
} 