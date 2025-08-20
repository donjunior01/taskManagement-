package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "event_type")
    private String eventType; // task, meeting, deadline, reminder, project
    
    @Column
    private String color;
    
    @Column(nullable = false)
    private String username;
    
    @Column(name = "all_day")
    private boolean allDay = false;
    
    @Column
    private String location;
    
    @Column(columnDefinition = "TEXT")
    private String attendees;
    
    @Column
    private String recurrence; // daily, weekly, monthly, yearly
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Additional properties for different event types
    @Column(name = "task_id")
    private Long taskId;
    
    @Column(name = "project_id")
    private Long projectId;
    
    @Column
    private String priority; // high, medium, low
    
    @Column
    private String status; // pending, in-progress, completed, cancelled
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

