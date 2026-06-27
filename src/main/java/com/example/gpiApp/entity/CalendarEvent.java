package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "calendar_events")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent implements TenantOwned {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "google_event_id")
    private String googleEventId;

    @Column(name = "google_calendar_id")
    private String googleCalendarId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "all_day")
    @Builder.Default
    private Boolean allDay = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_type")
    private String entityType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private allUsers user;

    @Column
    private String color;

    @Column
    private String location;

    @Column(name = "reminder_minutes")
    @Builder.Default
    private Integer reminderMinutes = 30;

    @Column(name = "is_synced")
    @Builder.Default
    private Boolean isSynced = false;

    /** Links all per-recipient copies of one distributed event so edits/deletes propagate. Null for personal events. */
    @Column(name = "series_id")
    private String seriesId;

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

    public enum EventType {
        PROJECT_START,
        PROJECT_END,
        PROJECT_MILESTONE,
        TASK_DEADLINE,
        TASK_REMINDER,
        DELIVERABLE_DUE,
        MEETING,
        REVIEW,
        CUSTOM
    }
}

