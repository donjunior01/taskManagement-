package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * A tenant-defined reusable task blueprint. Teams instantiate it to create a task pre-filled with a
 * standard description, priority, difficulty, default deadline offset and custom-field defaults —
 * standardizing recurring work (onboarding, incident response, release checklists, ...).
 */
@Data
@Entity
@Table(name = "task_templates")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskTemplate implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Column(name = "task_name")
    private String taskName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Task.TaskPriority priority = Task.TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Task.TaskDifficulty difficulty = Task.TaskDifficulty.MEDIUM;

    /** Days from "today" to set as the task deadline when instantiated; null = no deadline. */
    @Column(name = "default_deadline_days")
    private Integer defaultDeadlineDays;

    /** Default custom-field values copied onto the new task, keyed by CustomFieldDefinition id. */
    @Column(name = "custom_fields", columnDefinition = "TEXT")
    @Convert(converter = CustomFieldsConverter.class)
    @Builder.Default
    private Map<String, String> customFields = new LinkedHashMap<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
