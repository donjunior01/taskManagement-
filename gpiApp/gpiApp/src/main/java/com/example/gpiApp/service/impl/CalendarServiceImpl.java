package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.CalendarEventDTO;
import com.example.gpiApp.entity.CalendarEvent;
import com.example.gpiApp.repository.CalendarEventRepository;
import com.example.gpiApp.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {
    
    private final CalendarEventRepository calendarEventRepository;
    
    @Override
    public List<CalendarEventDTO> getEventsByUser(String username) {
        List<CalendarEvent> events = calendarEventRepository.findByUsername(username);
        return events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<CalendarEventDTO> getEventsByDateRange(String username, String startDate, String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
        LocalDateTime start = LocalDateTime.parse(startDate, formatter);
        LocalDateTime end = LocalDateTime.parse(endDate, formatter);
        
        List<CalendarEvent> events = calendarEventRepository.findByUsernameAndStartTimeBetween(username, start, end);
        return events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public CalendarEventDTO createEvent(CalendarEventDTO eventDTO) {
        CalendarEvent event = toEntity(eventDTO);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        
        CalendarEvent savedEvent = calendarEventRepository.save(event);
        return toDTO(savedEvent);
    }
    
    @Override
    public CalendarEventDTO updateEvent(Long eventId, CalendarEventDTO eventDTO) {
        CalendarEvent existingEvent = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Update fields
        existingEvent.setTitle(eventDTO.getTitle());
        existingEvent.setDescription(eventDTO.getDescription());
        existingEvent.setStartTime(eventDTO.getStartTime());
        existingEvent.setEndTime(eventDTO.getEndTime());
        existingEvent.setEventType(eventDTO.getEventType());
        existingEvent.setColor(eventDTO.getColor());
        existingEvent.setAllDay(eventDTO.isAllDay());
        existingEvent.setLocation(eventDTO.getLocation());
        existingEvent.setAttendees(eventDTO.getAttendees());
        existingEvent.setRecurrence(eventDTO.getRecurrence());
        existingEvent.setTaskId(eventDTO.getTaskId());
        existingEvent.setProjectId(eventDTO.getProjectId());
        existingEvent.setPriority(eventDTO.getPriority());
        existingEvent.setStatus(eventDTO.getStatus());
        existingEvent.setUpdatedAt(LocalDateTime.now());
        
        CalendarEvent updatedEvent = calendarEventRepository.save(existingEvent);
        return toDTO(updatedEvent);
    }
    
    @Override
    public void deleteEvent(Long eventId) {
        calendarEventRepository.deleteById(eventId);
    }
    
    @Override
    public List<CalendarEventDTO> getEventsByType(String username, String eventType) {
        List<CalendarEvent> events = calendarEventRepository.findByUsernameAndEventType(username, eventType);
        return events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<CalendarEventDTO> getUpcomingEvents(String username, int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = now.plusDays(days);
        
        List<CalendarEvent> events = calendarEventRepository.findByUsernameAndStartTimeBetween(username, now, endDate);
        return events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    private CalendarEventDTO toDTO(CalendarEvent event) {
        return CalendarEventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .eventType(event.getEventType())
                .color(event.getColor())
                .username(event.getUsername())
                .allDay(event.isAllDay())
                .location(event.getLocation())
                .attendees(event.getAttendees())
                .recurrence(event.getRecurrence())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .taskId(event.getTaskId())
                .projectId(event.getProjectId())
                .priority(event.getPriority())
                .status(event.getStatus())
                .build();
    }
    
    private CalendarEvent toEntity(CalendarEventDTO dto) {
        CalendarEvent event = new CalendarEvent();
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setEventType(dto.getEventType());
        event.setColor(dto.getColor());
        event.setUsername(dto.getUsername());
        event.setAllDay(dto.isAllDay());
        event.setLocation(dto.getLocation());
        event.setAttendees(dto.getAttendees());
        event.setRecurrence(dto.getRecurrence());
        event.setTaskId(dto.getTaskId());
        event.setProjectId(dto.getProjectId());
        event.setPriority(dto.getPriority());
        event.setStatus(dto.getStatus());
        return event;
    }
}
