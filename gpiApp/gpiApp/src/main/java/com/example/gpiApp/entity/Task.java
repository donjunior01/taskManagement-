package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "tasks")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "task_id")
    private UUID taskId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private allUsers createdBy;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private TaskCategory category;

    @ManyToOne
    @JoinColumn(name = "priority_id")
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false)
    private TaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(name = "actual_hours")
    private Integer actualHours;

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskAssignment> taskAssignments;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<Comment> comments;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskFile> taskFiles;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskProgress> taskProgress;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskDifficulty> taskDifficulties;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<DailyTaskSchedule> dailyTaskSchedules;

    public enum TaskType {
        PERSONAL, ASSIGNED, TEAM
    }

    public enum TaskStatus {
        DRAFT, ASSIGNED, IN_PROGRESS, COMPLETED, APPROVED, REJECTED, ON_HOLD
    }

    public enum DifficultyLevel {
        EASY, MEDIUM, HARD, VERY_HARD
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