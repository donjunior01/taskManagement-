package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "projects")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project implements TenantOwned {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owning tenant (multi-tenancy); stamped on insert, backfilled for existing rows. */
    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private allUsers manager;

    /** The user (typically an admin) who created this project — drives per-admin project counts & traceability. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private allUsers createdBy;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.ACTIVE;

    @Column(name = "progress")
    @Builder.Default
    private Integer progress = 0;

    @Column(name = "archived", nullable = false)
    @Builder.Default
    private Boolean archived = false;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Team> teams = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ProjectStatus {
        ACTIVE,
        COMPLETED,
        ON_HOLD,
        CANCELLED,
        PLANNED,
        IN_PROGRESS
    }
}

