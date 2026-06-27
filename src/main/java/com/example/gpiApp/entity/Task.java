package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "tasks")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task implements TenantOwned {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    /** Tasks that must finish before this one can proceed ("blocked by"). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "task_dependencies",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "blocked_by_task_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private java.util.Set<Task> blockedBy = new java.util.HashSet<>();

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private allUsers assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private allUsers createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskDifficulty difficulty = TaskDifficulty.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Column(name = "progress")
    @Builder.Default
    private Integer progress = 0;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type")
    private ReminderType reminderType;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TimeLog> timeLogs = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Deliverable> deliverables = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Tenant-defined custom field values, keyed by CustomFieldDefinition id. Stored as JSON. */
    @Column(name = "custom_fields", columnDefinition = "TEXT")
    @Convert(converter = CustomFieldsConverter.class)
    @Builder.Default
    private java.util.Map<String, String> customFields = new java.util.LinkedHashMap<>();

    /** Custom board column (WorkflowStatus id) when the org uses a custom workflow; null = default board.
     *  The canonical {@link #status} enum is always kept in sync with this column's category. */
    @Column(name = "workflow_status_id")
    private Long workflowStatusId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TaskPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum TaskDifficulty {
        EASY, MEDIUM, DIFFICULT, HARD
    }

    public enum TaskStatus {
        TODO, IN_PROGRESS, COMPLETED, OVERDUE, ON_HOLD
    }

    public enum ReminderType {
        NONE, EMAIL, POPUP, PUSH
    }
}

