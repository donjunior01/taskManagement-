package com.example.gpiApp.service;

import com.example.gpiApp.config.GoogleCalendarConfig;
import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.*;
import com.example.gpiApp.repository.*;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.google.api.services.calendar.model.Events;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DeliverableRepository deliverableRepository;
    private final UserRepository userRepository;
    private final GoogleCalendarConfig googleCalendarConfig;
    private final Calendar googleCalendar;
    
    public CalendarService(CalendarEventRepository calendarEventRepository,
                           ProjectRepository projectRepository,
                           TaskRepository taskRepository,
                           DeliverableRepository deliverableRepository,
                           UserRepository userRepository,
                           GoogleCalendarConfig googleCalendarConfig,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) Calendar googleCalendar) {
        this.calendarEventRepository = calendarEventRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.deliverableRepository = deliverableRepository;
        this.userRepository = userRepository;
        this.googleCalendarConfig = googleCalendarConfig;
        this.googleCalendar = googleCalendar;
    }

    @Value("${google.calendar.id:primary}")
    private String defaultCalendarId;

    private static final Map<CalendarEvent.EventType, String> EVENT_COLORS = Map.of(
            CalendarEvent.EventType.PROJECT_START, "#4361ee",
            CalendarEvent.EventType.PROJECT_END, "#2a9d8f",
            CalendarEvent.EventType.TASK_DEADLINE, "#e63946",
            CalendarEvent.EventType.DELIVERABLE_DUE, "#f4a261",
            CalendarEvent.EventType.MEETING, "#9b59b6",
            CalendarEvent.EventType.REVIEW, "#3498db",
            CalendarEvent.EventType.CUSTOM, "#6c757d"
    );

    // ===========================
    // LOCAL CALENDAR OPERATIONS
    // ===========================

    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getAllEvents() {
        return calendarEventRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getEventsByUser(Long userId) {
        return calendarEventRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getEventsByDateRange(LocalDateTime start, LocalDateTime end) {
        return calendarEventRepository.findByDateRange(start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getEventsByUserAndDateRange(Long userId, LocalDateTime start, LocalDateTime end) {
        return calendarEventRepository.findByUserIdAndDateRange(userId, start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getUpcomingEvents(Long userId) {
        return calendarEventRepository.findUpcomingEventsByUserId(userId, LocalDateTime.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApiResponse<CalendarEventDTO> getEventById(Long id) {
        return calendarEventRepository.findById(id)
                .map(event -> ApiResponse.success("Event retrieved successfully", convertToDTO(event)))
                .orElse(ApiResponse.error("Event not found"));
    }

    @Transactional
    public ApiResponse<CalendarEventDTO> createEvent(CalendarEventRequestDTO request, Long userId) {
        CalendarEvent event = new CalendarEvent();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setAllDay(request.getAllDay() != null ? request.getAllDay() : false);
        event.setEventType(request.getEventType() != null ? request.getEventType() : CalendarEvent.EventType.CUSTOM);
        event.setEntityId(request.getEntityId());
        event.setEntityType(request.getEntityType());
        event.setColor(request.getColor() != null ? request.getColor() : EVENT_COLORS.get(event.getEventType()));
        event.setLocation(request.getLocation());
        event.setReminderMinutes(request.getReminderMinutes() != null ? request.getReminderMinutes() : 30);

        userRepository.findById(userId).ifPresent(event::setUser);

        CalendarEvent savedEvent = calendarEventRepository.save(event);

        // Sync to Google Calendar if enabled and requested
        if (Boolean.TRUE.equals(request.getSyncToGoogle()) && googleCalendarConfig.isCalendarEnabled()) {
            try {
                syncEventToGoogle(savedEvent);
            } catch (IOException e) {
                log.error("Failed to sync event to Google Calendar", e);
            }
        }

        return ApiResponse.success("Event created successfully", convertToDTO(savedEvent));
    }

    @Transactional
    public ApiResponse<CalendarEventDTO> updateEvent(Long id, CalendarEventRequestDTO request) {
        return calendarEventRepository.findById(id)
                .map(event -> {
                    event.setTitle(request.getTitle());
                    event.setDescription(request.getDescription());
                    event.setStartTime(request.getStartTime());
                    event.setEndTime(request.getEndTime());
                    if (request.getAllDay() != null) event.setAllDay(request.getAllDay());
                    if (request.getEventType() != null) event.setEventType(request.getEventType());
                    if (request.getColor() != null) event.setColor(request.getColor());
                    if (request.getLocation() != null) event.setLocation(request.getLocation());
                    if (request.getReminderMinutes() != null) event.setReminderMinutes(request.getReminderMinutes());

                    CalendarEvent updatedEvent = calendarEventRepository.save(event);

                    // Update in Google Calendar if synced
                    if (event.getIsSynced() && googleCalendarConfig.isCalendarEnabled()) {
                        try {
                            updateEventInGoogle(updatedEvent);
                        } catch (IOException e) {
                            log.error("Failed to update event in Google Calendar", e);
                        }
                    }

                    return ApiResponse.success("Event updated successfully", convertToDTO(updatedEvent));
                })
                .orElse(ApiResponse.error("Event not found"));
    }

    @Transactional
    public ApiResponse<Void> deleteEvent(Long id) {
        return calendarEventRepository.findById(id)
                .map(event -> {
                    // Delete from Google Calendar if synced
                    if (event.getIsSynced() && googleCalendarConfig.isCalendarEnabled()) {
                        try {
                            deleteEventFromGoogle(event);
                        } catch (IOException e) {
                            log.error("Failed to delete event from Google Calendar", e);
                        }
                    }

                    calendarEventRepository.delete(event);
                    return ApiResponse.<Void>success("Event deleted successfully", null);
                })
                .orElse(ApiResponse.error("Event not found"));
    }

    // ===========================
    // PROJECT CALENDAR EVENTS
    // ===========================

    @Transactional
    public void createProjectCalendarEvents(Project project, Long userId) {
        allUsers user = userRepository.findById(userId).orElse(null);

        // Create project start event
        if (project.getStartDate() != null) {
            CalendarEvent startEvent = CalendarEvent.builder()
                    .title("Project Start: " + project.getName())
                    .description("Project '" + project.getName() + "' starts today.\n\n" + 
                            (project.getDescription() != null ? project.getDescription() : ""))
                    .startTime(project.getStartDate().atStartOfDay())
                    .endTime(project.getStartDate().atTime(23, 59))
                    .allDay(true)
                    .eventType(CalendarEvent.EventType.PROJECT_START)
                    .entityId(project.getId())
                    .entityType("PROJECT")
                    .user(user)
                    .color(EVENT_COLORS.get(CalendarEvent.EventType.PROJECT_START))
                    .reminderMinutes(1440) // 1 day before
                    .build();
            calendarEventRepository.save(startEvent);
        }

        // Create project end/deadline event
        if (project.getEndDate() != null) {
            CalendarEvent endEvent = CalendarEvent.builder()
                    .title("Project Deadline: " + project.getName())
                    .description("Project '" + project.getName() + "' deadline.\n\n" + 
                            (project.getDescription() != null ? project.getDescription() : ""))
                    .startTime(project.getEndDate().atStartOfDay())
                    .endTime(project.getEndDate().atTime(23, 59))
                    .allDay(true)
                    .eventType(CalendarEvent.EventType.PROJECT_END)
                    .entityId(project.getId())
                    .entityType("PROJECT")
                    .user(user)
                    .color(EVENT_COLORS.get(CalendarEvent.EventType.PROJECT_END))
                    .reminderMinutes(4320) // 3 days before
                    .build();
            calendarEventRepository.save(endEvent);
        }
    }

    @Transactional
    public void updateProjectCalendarEvents(Project project) {
        // Delete existing project events
        calendarEventRepository.deleteByEntityTypeAndEntityId("PROJECT", project.getId());
        
        // Recreate with updated dates
        if (project.getManager() != null) {
            createProjectCalendarEvents(project, project.getManager().getId());
        }
    }

    // ===========================
    // TASK CALENDAR EVENTS
    // ===========================

    @Transactional
    public void createTaskCalendarEvent(Task task, Long userId) {
        if (task.getDeadline() == null) return;

        allUsers user = userRepository.findById(userId).orElse(null);

        CalendarEvent taskEvent = CalendarEvent.builder()
                .title("Task Due: " + task.getName())
                .description("Task '" + task.getName() + "' is due.\n\n" +
                        "Priority: " + task.getPriority() + "\n" +
                        "Status: " + task.getStatus() + "\n\n" +
                        (task.getDescription() != null ? task.getDescription() : ""))
                .startTime(task.getDeadline().atStartOfDay())
                .endTime(task.getDeadline().atTime(23, 59))
                .allDay(true)
                .eventType(CalendarEvent.EventType.TASK_DEADLINE)
                .entityId(task.getId())
                .entityType("TASK")
                .user(user)
                .color(EVENT_COLORS.get(CalendarEvent.EventType.TASK_DEADLINE))
                .reminderMinutes(1440) // 1 day before
                .build();

        calendarEventRepository.save(taskEvent);
    }

    @Transactional
    public void updateTaskCalendarEvent(Task task) {
        calendarEventRepository.deleteByEntityTypeAndEntityId("TASK", task.getId());
        
        if (task.getAssignedTo() != null) {
            createTaskCalendarEvent(task, task.getAssignedTo().getId());
        }
    }

    // ===========================
    // DELIVERABLE CALENDAR EVENTS
    // ===========================

    @Transactional
    public void createDeliverableCalendarEvent(Deliverable deliverable, Long userId) {
        allUsers user = userRepository.findById(userId).orElse(null);
        
        LocalDateTime dueTime = deliverable.getCreatedAt() != null ? 
                deliverable.getCreatedAt().plusDays(7) : LocalDateTime.now().plusDays(7);

        CalendarEvent deliverableEvent = CalendarEvent.builder()
                .title("Deliverable: " + deliverable.getFileName())
                .description("Deliverable '" + deliverable.getFileName() + "' review.\n\n" +
                        "Status: " + deliverable.getStatus())
                .startTime(dueTime)
                .endTime(dueTime.plusHours(1))
                .allDay(false)
                .eventType(CalendarEvent.EventType.DELIVERABLE_DUE)
                .entityId(deliverable.getId())
                .entityType("DELIVERABLE")
                .user(user)
                .color(EVENT_COLORS.get(CalendarEvent.EventType.DELIVERABLE_DUE))
                .reminderMinutes(60) // 1 hour before
                .build();

        calendarEventRepository.save(deliverableEvent);
    }

    // ===========================
    // GOOGLE CALENDAR SYNC
    // ===========================

    public void syncEventToGoogle(CalendarEvent calendarEvent) throws IOException {
        if (googleCalendar == null) {
            log.warn("Google Calendar is not configured");
            return;
        }

        Event googleEvent = new Event()
                .setSummary(calendarEvent.getTitle())
                .setDescription(calendarEvent.getDescription())
                .setLocation(calendarEvent.getLocation());

        // Set start time
        EventDateTime start = new EventDateTime();
        if (Boolean.TRUE.equals(calendarEvent.getAllDay())) {
            start.setDate(new DateTime(calendarEvent.getStartTime().toLocalDate().toString()));
        } else {
            start.setDateTime(new DateTime(calendarEvent.getStartTime()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
        }
        googleEvent.setStart(start);

        // Set end time
        EventDateTime end = new EventDateTime();
        if (Boolean.TRUE.equals(calendarEvent.getAllDay())) {
            end.setDate(new DateTime(calendarEvent.getEndTime().toLocalDate().toString()));
        } else {
            end.setDateTime(new DateTime(calendarEvent.getEndTime()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
        }
        googleEvent.setEnd(end);

        // Set reminder
        if (calendarEvent.getReminderMinutes() != null) {
            Event.Reminders reminders = new Event.Reminders()
                    .setUseDefault(false)
                    .setOverrides(Collections.singletonList(
                            new EventReminder().setMethod("popup").setMinutes(calendarEvent.getReminderMinutes())
                    ));
            googleEvent.setReminders(reminders);
        }

        Event createdEvent = googleCalendar.events()
                .insert(defaultCalendarId, googleEvent)
                .execute();

        calendarEvent.setGoogleEventId(createdEvent.getId());
        calendarEvent.setGoogleCalendarId(defaultCalendarId);
        calendarEvent.setIsSynced(true);
        calendarEventRepository.save(calendarEvent);

        log.info("Event synced to Google Calendar: {}", createdEvent.getId());
    }

    public void updateEventInGoogle(CalendarEvent calendarEvent) throws IOException {
        if (googleCalendar == null || calendarEvent.getGoogleEventId() == null) {
            return;
        }

        Event googleEvent = googleCalendar.events()
                .get(calendarEvent.getGoogleCalendarId(), calendarEvent.getGoogleEventId())
                .execute();

        googleEvent.setSummary(calendarEvent.getTitle());
        googleEvent.setDescription(calendarEvent.getDescription());
        googleEvent.setLocation(calendarEvent.getLocation());

        // Update times
        EventDateTime start = new EventDateTime();
        EventDateTime end = new EventDateTime();
        
        if (Boolean.TRUE.equals(calendarEvent.getAllDay())) {
            start.setDate(new DateTime(calendarEvent.getStartTime().toLocalDate().toString()));
            end.setDate(new DateTime(calendarEvent.getEndTime().toLocalDate().toString()));
        } else {
            start.setDateTime(new DateTime(calendarEvent.getStartTime()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
            end.setDateTime(new DateTime(calendarEvent.getEndTime()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
        }
        googleEvent.setStart(start);
        googleEvent.setEnd(end);

        googleCalendar.events()
                .update(calendarEvent.getGoogleCalendarId(), calendarEvent.getGoogleEventId(), googleEvent)
                .execute();

        log.info("Event updated in Google Calendar: {}", calendarEvent.getGoogleEventId());
    }

    public void deleteEventFromGoogle(CalendarEvent calendarEvent) throws IOException {
        if (googleCalendar == null || calendarEvent.getGoogleEventId() == null) {
            return;
        }

        googleCalendar.events()
                .delete(calendarEvent.getGoogleCalendarId(), calendarEvent.getGoogleEventId())
                .execute();

        log.info("Event deleted from Google Calendar: {}", calendarEvent.getGoogleEventId());
    }

    public List<CalendarEventDTO> fetchEventsFromGoogle(LocalDateTime start, LocalDateTime end) throws IOException {
        if (googleCalendar == null) {
            return Collections.emptyList();
        }

        DateTime timeMin = new DateTime(start.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        DateTime timeMax = new DateTime(end.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        Events events = googleCalendar.events()
                .list(defaultCalendarId)
                .setTimeMin(timeMin)
                .setTimeMax(timeMax)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        return events.getItems().stream()
                .map(this::convertGoogleEventToDTO)
                .collect(Collectors.toList());
    }

    // ===========================
    // HELPER METHODS
    // ===========================

    private CalendarEventDTO convertToDTO(CalendarEvent event) {
        return CalendarEventDTO.builder()
                .id(event.getId())
                .googleEventId(event.getGoogleEventId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .allDay(event.getAllDay())
                .eventType(event.getEventType())
                .entityId(event.getEntityId())
                .entityType(event.getEntityType())
                .userId(event.getUser() != null ? event.getUser().getId() : null)
                .userName(event.getUser() != null ? 
                        event.getUser().getFirstName() + " " + event.getUser().getLastName() : null)
                .color(event.getColor())
                .location(event.getLocation())
                .reminderMinutes(event.getReminderMinutes())
                .isSynced(event.getIsSynced())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                // For FullCalendar.js
                .start(event.getStartTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .end(event.getEndTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    private CalendarEventDTO convertGoogleEventToDTO(Event googleEvent) {
        LocalDateTime startTime = null;
        LocalDateTime endTime = null;
        boolean allDay = false;

        if (googleEvent.getStart().getDate() != null) {
            // All-day event
            allDay = true;
            startTime = LocalDate.parse(googleEvent.getStart().getDate().toString()).atStartOfDay();
            endTime = LocalDate.parse(googleEvent.getEnd().getDate().toString()).atStartOfDay();
        } else {
            startTime = LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(googleEvent.getStart().getDateTime().getValue()),
                    ZoneId.systemDefault());
            endTime = LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(googleEvent.getEnd().getDateTime().getValue()),
                    ZoneId.systemDefault());
        }

        return CalendarEventDTO.builder()
                .googleEventId(googleEvent.getId())
                .title(googleEvent.getSummary())
                .description(googleEvent.getDescription())
                .startTime(startTime)
                .endTime(endTime)
                .allDay(allDay)
                .location(googleEvent.getLocation())
                .isSynced(true)
                .start(startTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .end(endTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }
    
    // ===========================
    // NEW CALENDAR REDESIGN METHODS (Google Calendar-like)
    // ===========================
    
    /**
     * Create new event (enhanced for Google Calendar redesign)
     */
    @Transactional
    public CalendarEventDTO createEventEnhanced(CalendarEventDTO dto, allUsers user) {
        CalendarEvent event = CalendarEvent.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(dto.getLocation())
                .color(dto.getColor() != null ? dto.getColor() : "#4361EE")
                .allDay(dto.getAllDay() != null ? dto.getAllDay() : false)
                .reminderMinutes(dto.getReminderMinutes() != null ? dto.getReminderMinutes() : 30)
                .user(user)
                .eventType(CalendarEvent.EventType.CUSTOM)
                .build();
        
        CalendarEvent saved = calendarEventRepository.save(event);
        log.info("Calendar event created: {} for user: {}", saved.getId(), user.getUsername());
        
        return convertToDTO(saved);
    }
    
    /**
     * Get events for current user (used by redesigned calendar)
     */
    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getUserEventsEnhanced(allUsers user) {
        List<CalendarEvent> events = calendarEventRepository.findByUserOrderByStartTimeAsc(user);
        return events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get upcoming events with limit
     */
    @Transactional(readOnly = true)
    public List<CalendarEventDTO> getUpcomingEventsEnhanced(allUsers user, int limit) {
        LocalDateTime now = LocalDateTime.now();
        List<CalendarEvent> events = calendarEventRepository
                .findByUserAndStartTimeGreaterThanOrderByStartTimeAsc(user, now, 
                    org.springframework.data.domain.PageRequest.of(0, limit))
                .getContent();
        return events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete event (enhanced for Google Calendar redesign)
     */
    @Transactional
    public void deleteEventEnhanced(Long id, allUsers user) {
        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this event");
        }
        
        calendarEventRepository.delete(event);
        log.info("Calendar event deleted: {} by user: {}", id, user.getUsername());
    }
}

