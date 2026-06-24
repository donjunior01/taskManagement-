package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "deliverables")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deliverable implements TenantOwned {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private allUsers submittedBy;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String fileUrl;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliverableStatus status = DeliverableStatus.PENDING;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private allUsers reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

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

    public enum DeliverableStatus {
        PENDING, APPROVED, REJECTED
    }
}

