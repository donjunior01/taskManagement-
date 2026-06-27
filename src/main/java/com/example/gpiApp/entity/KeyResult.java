package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A measurable key result under an {@link Objective}. Progress = (current - start) / (target - start),
 * clamped 0–100 (computed client-side from these values).
 */
@Data
@Entity
@Table(name = "key_results")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyResult implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "objective_id", nullable = false)
    private Long objectiveId;

    @Column(nullable = false)
    private String title;

    @Column(name = "start_value")
    @Builder.Default
    private Double startValue = 0.0;

    @Column(name = "target_value")
    @Builder.Default
    private Double targetValue = 100.0;

    @Column(name = "current_value")
    @Builder.Default
    private Double currentValue = 0.0;

    /** Unit label shown next to values, e.g. "%", "$", "users". */
    @Column(length = 20)
    private String unit;
}
