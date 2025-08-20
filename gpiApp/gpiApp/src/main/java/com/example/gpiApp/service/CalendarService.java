package com.example.gpiApp.service;

import com.example.gpiApp.dto.CalendarEventDTO;
import java.util.List;

public interface CalendarService {
    
    /**
     * Get all calendar events for a user
     */
    List<CalendarEventDTO> getEventsByUser(String username);
    
    /**
     * Get calendar events for a specific date range
     */
    List<CalendarEventDTO> getEventsByDateRange(String username, String startDate, String endDate);
    
    /**
     * Create a new calendar event
     */
    CalendarEventDTO createEvent(CalendarEventDTO eventDTO);
    
    /**
     * Update an existing calendar event
     */
    CalendarEventDTO updateEvent(Long eventId, CalendarEventDTO eventDTO);
    
    /**
     * Delete a calendar event
     */
    void deleteEvent(Long eventId);
    
    /**
     * Get events by type for a user
     */
    List<CalendarEventDTO> getEventsByType(String username, String eventType);
    
    /**
     * Get upcoming events for a user
     */
    List<CalendarEventDTO> getUpcomingEvents(String username, int days);
}
