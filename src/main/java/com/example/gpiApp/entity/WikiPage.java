package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A page in the tenant's knowledge base / wiki. Pages can nest via {@code parentId} to form a tree
 * (spaces → pages → sub-pages). Content is stored as Markdown and rendered client-side.
 */
@Data
@Entity
@Table(name = "wiki_pages")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WikiPage implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    /** Parent page id for nesting; null = top-level page. */
    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "icon", length = 16)
    private String icon;

    @Column(name = "created_by_id")
    private Long createdById;
    @Column(name = "created_by_name")
    private String createdByName;
    @Column(name = "updated_by_id")
    private Long updatedById;
    @Column(name = "updated_by_name")
    private String updatedByName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
