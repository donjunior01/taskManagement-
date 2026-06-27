package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * An OKR objective — a qualitative, time-boxed goal (e.g. "Delight our enterprise customers"). Its
 * measurable progress comes from the {@link KeyResult}s linked by {@code objectiveId}.
 */
@Data
@Entity
@Table(name = "objectives")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Objective implements TenantOwned {

    public enum Status { ON_TRACK, AT_RISK, OFF_TRACK, ACHIEVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Free-text period label, e.g. "Q3 2026". */
    @Column(length = 40)
    private String period;

    @Column(name = "owner_id")
    private Long ownerId;
    @Column(name = "owner_name")
    private String ownerName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private Status status = Status.ON_TRACK;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
