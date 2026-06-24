package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDateTime;

// Declares the tenant scoping filter used across tenant-owned entities. A filter is INERT until it is
// explicitly enabled per request, so its presence alone never changes query behaviour.
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "orgId", type = Long.class))

/**
 * A tenant — one isolated customer/organization in the multi-tenant SaaS. Almost every record will
 * carry an organization_id and queries are scoped to the caller's organization so tenants never see
 * each other's data. ID 1 is the seeded "Default Organization" that existing single-org data belongs to.
 */
@Data
@Entity
@Table(name = "organizations", indexes = { @Index(name = "idx_org_slug", columnList = "slug", unique = true) })
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** URL-safe unique handle (e.g. "acme-corp"). */
    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    /** Subscription plan key (e.g. FREE, PRO, ENTERPRISE) — drives limits/billing later. */
    @Column(name = "plan", nullable = false, length = 40)
    @Builder.Default
    private String plan = "FREE";

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
