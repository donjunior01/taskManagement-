package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A tenant-defined custom field that teams can attach to tasks (e.g. "Sprint", "Story Points",
 * "Customer"). Values live in {@code Task.customFields} keyed by this definition's id. This lets each
 * organization model its own metadata without schema changes — a core Jira/Monday capability.
 */
@Data
@Entity
@Table(name = "custom_field_definitions")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomFieldDefinition implements TenantOwned {

    public enum FieldType { TEXT, NUMBER, DATE, SELECT, CHECKBOX }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 20)
    @Builder.Default
    private FieldType fieldType = FieldType.TEXT;

    /** Comma-separated choices for SELECT fields; ignored otherwise. */
    @Column(length = 1000)
    private String options;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = false;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

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
