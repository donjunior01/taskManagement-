package com.example.gpiApp.dto;

import com.example.gpiApp.entity.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEventRequestDTO {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean allDay;
    private CalendarEvent.EventType eventType;
    private Long entityId;
    private String entityType;
    private String color;
    private String location;
    private Integer reminderMinutes;
    private Boolean syncToGoogle;
}

