package com.example.gpiApp.controller;

import com.example.gpiApp.dto.CalendarEventDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/calendar-events")
@RequiredArgsConstructor
public class CalendarEventController {
    
    private final CalendarService calendarService;
    private final UserRepository userRepository;
    
    /**
     * Get current user from security context
     */
    private allUsers getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    /**
     * Get all events for current user
     */
    @GetMapping
    public ResponseEntity<List<CalendarEventDTO>> getAllEvents() {
        allUsers user = getCurrentUser();
        return ResponseEntity.ok(calendarService.getUserEventsEnhanced(user));
    }
    
    /**
     * Get upcoming events for current user
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<CalendarEventDTO>> getUpcomingEvents(
            @RequestParam(defaultValue = "5") int limit) {
        allUsers user = getCurrentUser();
        return ResponseEntity.ok(calendarService.getUpcomingEventsEnhanced(user, limit));
    }
    
    /**
     * Get events by date range
     */
    @GetMapping("/range")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        LocalDateTime start = LocalDateTime.parse(startDate, formatter);
        LocalDateTime end = LocalDateTime.parse(endDate, formatter);
        return ResponseEntity.ok(calendarService.getEventsByDateRange(start, end));
    }
    
    /**
     * Get single event
     */
    @GetMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> getEvent(@PathVariable Long id) {
        allUsers user = getCurrentUser();
        List<CalendarEventDTO> events = calendarService.getUserEventsEnhanced(user);
        CalendarEventDTO event = events.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return ResponseEntity.ok(event);
    }
    
    /**
     * Get events for specific task
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<CalendarEventDTO>> getEventsByTask(@PathVariable Long taskId) {
        allUsers user = getCurrentUser();
        List<CalendarEventDTO> events = calendarService.getUserEventsEnhanced(user);
        // Filter events by entity ID (task-linked events)
        List<CalendarEventDTO> taskEvents = events.stream()
                .filter(e -> taskId.equals(e.getEntityId()) && "TASK".equals(e.getEntityType()))
                .toList();
        return ResponseEntity.ok(taskEvents);
    }
    
    /**
     * Search events
     */
    @GetMapping("/search")
    public ResponseEntity<List<CalendarEventDTO>> searchEvents(@RequestParam String query) {
        allUsers user = getCurrentUser();
        List<CalendarEventDTO> events = calendarService.getUserEventsEnhanced(user);
        List<CalendarEventDTO> results = events.stream()
                .filter(e -> e.getTitle().toLowerCase().contains(query.toLowerCase()) ||
                           (e.getDescription() != null && e.getDescription().toLowerCase().contains(query.toLowerCase())))
                .toList();
        return ResponseEntity.ok(results);
    }
    
    /**
     * Create new event
     */
    @PostMapping
    public ResponseEntity<CalendarEventDTO> createEvent(@RequestBody CalendarEventDTO dto) {
        allUsers user = getCurrentUser();
        return ResponseEntity.ok(calendarService.createEventEnhanced(dto, user));
    }
    
    /**
     * Update event
     */
    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventDTO dto) {
        allUsers user = getCurrentUser();
        List<CalendarEventDTO> events = calendarService.getUserEventsEnhanced(user);
        CalendarEventDTO existing = events.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        dto.setId(id);
        return ResponseEntity.ok(calendarService.createEventEnhanced(dto, user));
    }
    
    /**
     * Delete event
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        allUsers user = getCurrentUser();
        calendarService.deleteEventEnhanced(id, user);
        return ResponseEntity.ok().build();
    }
}
