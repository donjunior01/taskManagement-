package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A tenant-scoped "When ▸ If ▸ Then" automation rule. When {@code trigger} fires for the org and the
 * (optional) condition matches, {@code action} runs. Kept as a single condition + single action for a
 * clean first version; both can grow to lists later.
 */
@Data
@Entity
@Table(name = "automation_rules")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationRule implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /** Event that fires the rule, e.g. "task.created", "task.status_changed". */
    @Column(nullable = false, length = 60)
    private String trigger;

    /** Optional condition: a context field that must equal conditionValue (e.g. field "priority" = "HIGH"). */
    @Column(name = "condition_field", length = 60)
    private String conditionField;
    @Column(name = "condition_value")
    private String conditionValue;

    /** Action to run: "set_priority" | "set_status" | "notify". actionValue is the parameter. */
    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;
    @Column(name = "action_value")
    private String actionValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;
    @Column(name = "run_count", nullable = false)
    @Builder.Default
    private long runCount = 0;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
