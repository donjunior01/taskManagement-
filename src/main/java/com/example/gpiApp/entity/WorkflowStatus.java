package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A tenant-defined board column / workflow stage (e.g. "Design Review", "QA", "Blocked"). It layers
 * over the canonical {@link Task.TaskStatus} enum: each custom status maps to a {@link Category} so all
 * existing logic (dashboards, analytics, automation, overdue) keeps working off the enum, while the
 * board renders the team's own columns. Workflows are opt-in — with none defined the board uses the
 * default enum columns unchanged.
 */
@Data
@Entity
@Table(name = "workflow_statuses")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStatus implements TenantOwned {

    /** Canonical bucket a custom status rolls up to, so enum-based logic stays correct. */
    public enum Category { TODO, IN_PROGRESS, DONE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Category category = Category.TODO;

    @Column(length = 20)
    private String color;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Maps this column's category onto the canonical task status the enum-based code expects. */
    public Task.TaskStatus toTaskStatus() {
        return switch (category) {
            case DONE -> Task.TaskStatus.COMPLETED;
            case IN_PROGRESS -> Task.TaskStatus.IN_PROGRESS;
            default -> Task.TaskStatus.TODO;
        };
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
