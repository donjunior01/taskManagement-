package com.example.gpiApp.controller;

import com.example.gpiApp.dto.CalendarEventDTO;
import com.example.gpiApp.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {
    
    private final CalendarService calendarService;
    
    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventDTO>> getUserEvents() {
        String username = getCurrentUsername();
        List<CalendarEventDTO> events = calendarService.getEventsByUser(username);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/events/range")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        String username = getCurrentUsername();
        List<CalendarEventDTO> events = calendarService.getEventsByDateRange(username, startDate, endDate);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/events/type/{eventType}")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByType(@PathVariable String eventType) {
        String username = getCurrentUsername();
        List<CalendarEventDTO> events = calendarService.getEventsByType(username, eventType);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/events/upcoming")
    public ResponseEntity<List<CalendarEventDTO>> getUpcomingEvents(@RequestParam(defaultValue = "7") int days) {
        String username = getCurrentUsername();
        List<CalendarEventDTO> events = calendarService.getUpcomingEvents(username, days);
        return ResponseEntity.ok(events);
    }
    
    @PostMapping("/events")
    public ResponseEntity<CalendarEventDTO> createEvent(@RequestBody CalendarEventDTO eventDTO) {
        String username = getCurrentUsername();
        eventDTO.setUsername(username);
        CalendarEventDTO createdEvent = calendarService.createEvent(eventDTO);
        return ResponseEntity.ok(createdEvent);
    }
    
    @PutMapping("/events/{eventId}")
    public ResponseEntity<CalendarEventDTO> updateEvent(
            @PathVariable Long eventId,
            @RequestBody CalendarEventDTO eventDTO) {
        String username = getCurrentUsername();
        eventDTO.setUsername(username);
        CalendarEventDTO updatedEvent = calendarService.updateEvent(eventId, eventDTO);
        return ResponseEntity.ok(updatedEvent);
    }
    
    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long eventId) {
        calendarService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/events/task/{taskId}")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByTask(@PathVariable Long taskId) {
        String username = getCurrentUsername();
        // This would need to be implemented in the service to filter by task and username
        List<CalendarEventDTO> events = calendarService.getEventsByUser(username)
                .stream()
                .filter(event -> taskId.equals(event.getTaskId()))
                .toList();
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/events/project/{projectId}")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByProject(@PathVariable Long projectId) {
        String username = getCurrentUsername();
        // This would need to be implemented in the service to filter by project and username
        List<CalendarEventDTO> events = calendarService.getEventsByUser(username)
                .stream()
                .filter(event -> projectId.equals(event.getProjectId()))
                .toList();
        return ResponseEntity.ok(events);
    }
    
    @PostMapping("/events/bulk")
    public ResponseEntity<List<CalendarEventDTO>> createBulkEvents(@RequestBody List<CalendarEventDTO> eventDTOs) {
        String username = getCurrentUsername();
        List<CalendarEventDTO> createdEvents = eventDTOs.stream()
                .map(eventDTO -> {
                    eventDTO.setUsername(username);
                    return calendarService.createEvent(eventDTO);
                })
                .toList();
        return ResponseEntity.ok(createdEvents);
    }
    
    @GetMapping("/events/search")
    public ResponseEntity<List<CalendarEventDTO>> searchEvents(@RequestParam String query) {
        String username = getCurrentUsername();
        // This would need a search method in the service
        List<CalendarEventDTO> allEvents = calendarService.getEventsByUser(username);
        List<CalendarEventDTO> filteredEvents = allEvents.stream()
                .filter(event -> 
                    event.getTitle().toLowerCase().contains(query.toLowerCase()) ||
                    (event.getDescription() != null && event.getDescription().toLowerCase().contains(query.toLowerCase())) ||
                    (event.getLocation() != null && event.getLocation().toLowerCase().contains(query.toLowerCase()))
                )
                .toList();
        return ResponseEntity.ok(filteredEvents);
    }
    
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "anonymous";
    }
}

