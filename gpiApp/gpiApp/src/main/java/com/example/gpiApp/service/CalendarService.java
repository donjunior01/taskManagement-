package com.example.gpiApp.service;

import com.example.gpiApp.dto.CalendarEventDTO;
import java.util.List;

public interface CalendarService {
    List<CalendarEventDTO> getEventsByUser(String username);
}
