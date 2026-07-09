package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A user's customizable dashboard: which KPI widgets they show and in what order. Keyed uniquely by
 * user (one layout per user). {@code widgets} is an opaque JSON array of widget keys defined by the
 * frontend catalog — the backend only persists and returns it.
 */
@Data
@Entity
@Table(name = "dashboard_layouts")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String widgets;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
