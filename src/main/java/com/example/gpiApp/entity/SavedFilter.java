package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A server-side saved filter / view: a named bundle of filter criteria a user can re-apply. Owned by
 * one user but tenant-scoped; when {@code shared} is true it is visible to the whole organization.
 * {@code criteria} is opaque JSON produced and consumed by the frontend (search term, project,
 * assignee, priority, status, layout, …).
 */
@Data
@Entity
@Table(name = "saved_filters")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedFilter implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 120)
    private String name;

    /** Which list the filter applies to, e.g. "tasks". */
    @Column(nullable = false, length = 40)
    @Builder.Default
    private String resource = "tasks";

    @Column(columnDefinition = "TEXT")
    private String criteria;

    @Column(nullable = false)
    @Builder.Default
    private boolean shared = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
