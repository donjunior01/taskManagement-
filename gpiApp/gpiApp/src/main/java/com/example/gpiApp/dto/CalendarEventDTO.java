package com.example.gpiApp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CalendarEventDTO {
    private Long id;
    private String title;
    private String description;
    private String type;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String organizer;
    private String attendees;
    private String color;
}
