package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDTO {
    
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String eventType; // task, meeting, deadline, reminder, project
    private String color;
    private String username;
    private boolean allDay;
    private String location;
    private String attendees;
    private String recurrence; // daily, weekly, monthly, yearly
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional properties for different event types
    private Long taskId; // If event is linked to a task
    private Long projectId; // If event is linked to a project
    private String priority; // high, medium, low
    private String status; // pending, in-progress, completed, cancelled
}
