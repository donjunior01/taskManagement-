package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.CalendarEventDTO;
import com.example.gpiApp.service.CalendarService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CalendarServiceImpl implements CalendarService {

    @Override
    public List<CalendarEventDTO> getEventsByUser(String username) {
        List<CalendarEventDTO> events = new ArrayList<>();
        
        CalendarEventDTO event1 = new CalendarEventDTO();
        event1.setId(1L);
        event1.setTitle("Team Meeting");
        event1.setDescription("Weekly team sync meeting");
        event1.setType("meeting");
        event1.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
        event1.setEndTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0));
        event1.setLocation("Conference Room A");
        event1.setOrganizer("jane.smith");
        event1.setAttendees("john.doe, admin");
        event1.setColor("#007bff");
        events.add(event1);
        
        return events;
    }
}
