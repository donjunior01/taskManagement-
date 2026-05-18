package com.example.gpiApp.dto;

import com.example.gpiApp.entity.CalendarEvent;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @NotBlank(message = "Event title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;
    
    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
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

