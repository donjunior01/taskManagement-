package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A recurring report export: on its cadence the scheduler generates {@code reportType} for the owning
 * organization and emails it (CSV attachment) to {@code recipients}. Tenant-scoped; the scheduler sets
 * the TenantContext to {@code organizationId} before generating so the data reflects that org only.
 */
@Data
@Entity
@Table(name = "scheduled_reports")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledReport implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false, length = 120)
    private String name;

    /** What to generate: "tasks-csv" | "projects-csv". */
    @Column(name = "report_type", nullable = false, length = 40)
    private String reportType;

    /** How often to send: "DAILY" | "WEEKLY" (Mondays) | "MONTHLY" (1st of month). */
    @Column(nullable = false, length = 20)
    private String frequency;

    /** Comma-separated recipient email addresses. */
    @Column(nullable = false, length = 2000)
    private String recipients;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "last_run_on")
    private LocalDate lastRunOn;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
