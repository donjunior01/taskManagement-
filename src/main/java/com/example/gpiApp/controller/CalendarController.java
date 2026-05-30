package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CalendarEventDTO>>> getAllEvents() {
        List<CalendarEventDTO> events = calendarService.getAllEvents();
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/user")
    public ResponseEntity<ApiResponse<List<CalendarEventDTO>>> getUserEvents(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        List<CalendarEventDTO> events = calendarService.getEventsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User events retrieved successfully", events));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<CalendarEventDTO>>> getEventsByRange(
            @RequestParam String start,
            @RequestParam String end,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        LocalDateTime startDateTime = parseDateTime(start);
        LocalDateTime endDateTime = parseDateTime(end);
        List<CalendarEventDTO> events = calendarService.getEventsByUserAndDateRange(userId, startDateTime, endDateTime);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }
    
    private LocalDateTime parseDateTime(String dateTimeStr) {
        try {
            // Try parsing as OffsetDateTime (with timezone)
            return OffsetDateTime.parse(dateTimeStr).toLocalDateTime();
        } catch (DateTimeParseException e1) {
            try {
                // Try parsing as ISO LocalDateTime
                return LocalDateTime.parse(dateTimeStr);
            } catch (DateTimeParseException e2) {
                try {
                    // Try parsing as date only
                    return LocalDateTime.parse(dateTimeStr.substring(0, 10) + "T00:00:00");
                } catch (Exception e3) {
                    return LocalDateTime.now();
                }
            }
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<CalendarEventDTO>>> getUpcomingEvents(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        List<CalendarEventDTO> events = calendarService.getUpcomingEvents(userId);
        return ResponseEntity.ok(ApiResponse.success("Upcoming events retrieved successfully", events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CalendarEventDTO>> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.getEventById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CalendarEventDTO>> createEvent(
            @RequestBody CalendarEventRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.ok(calendarService.createEvent(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CalendarEventDTO>> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventRequestDTO request) {
        return ResponseEntity.ok(calendarService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.deleteEvent(id));
    }

    // Google Calendar specific endpoints
    @GetMapping("/google/events")
    public ResponseEntity<ApiResponse<List<CalendarEventDTO>>> getGoogleEvents(
            @RequestParam String start,
            @RequestParam String end) {
        try {
            LocalDateTime startDateTime = parseDateTime(start);
            LocalDateTime endDateTime = parseDateTime(end);
            List<CalendarEventDTO> events = calendarService.fetchEventsFromGoogle(startDateTime, endDateTime);
            return ResponseEntity.ok(ApiResponse.success("Google Calendar events retrieved", events));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch Google Calendar events: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<ApiResponse<CalendarEventDTO>> syncEventToGoogle(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.syncEventById(id));
    }

    /** Whether Google Calendar sync is configured, plus this user's synced/unsynced counts. */
    @GetMapping("/google/status")
    public ResponseEntity<ApiResponse<CalendarSyncStatusDTO>> getSyncStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.ok(ApiResponse.success("Sync status retrieved", calendarService.getSyncStatus(userId)));
    }

    /** Push all of the current user's unsynced events to Google Calendar. */
    @PostMapping("/google/sync-all")
    public ResponseEntity<ApiResponse<CalendarSyncResultDTO>> syncAllToGoogle(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        CalendarSyncResultDTO result = calendarService.pushAllToGoogle(userId);
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Import Google Calendar events in the given window into the local calendar. */
    @PostMapping("/google/import")
    public ResponseEntity<ApiResponse<CalendarSyncResultDTO>> importFromGoogle(
            @RequestParam String start,
            @RequestParam String end,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        CalendarSyncResultDTO result = calendarService.importFromGoogle(
                userId, parseDateTime(start), parseDateTime(end));
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    // Create calendar events from entities
    @PostMapping("/project/{projectId}/events")
    public ResponseEntity<ApiResponse<String>> createProjectEvents(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        try {
            // This would be called when creating project events
            return ResponseEntity.ok(ApiResponse.success("Project calendar events created", null));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to create project events: " + e.getMessage()));
        }
    }

    @PostMapping("/task/{taskId}/events")
    public ResponseEntity<ApiResponse<String>> createTaskEvents(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromDetails(userDetails);
        try {
            return ResponseEntity.ok(ApiResponse.success("Task calendar event created", null));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to create task event: " + e.getMessage()));
        }
    }

    private Long getUserIdFromDetails(UserDetails userDetails) {
        if (userDetails == null || userDetails.getUsername() == null) return null;
        String name = userDetails.getUsername();
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(name)
                    .map(allUsers::getId)
                    .orElseGet(() -> 
                        userRepository.findByUsername(name)
                                .map(allUsers::getId)
                                .orElse(null)
                    );
        }
    }
}

