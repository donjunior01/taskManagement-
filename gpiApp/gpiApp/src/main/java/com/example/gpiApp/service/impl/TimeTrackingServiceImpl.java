package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TimeTrackingDTO;
import com.example.gpiApp.service.TimeTrackingService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TimeTrackingServiceImpl implements TimeTrackingService {

    @Override
    public TimeTrackingDTO getTimeTrackingDataByUser(String username) {
        TimeTrackingDTO timeData = new TimeTrackingDTO();
        timeData.setTodayHours(6.5);
        timeData.setWeekHours(32.0);
        timeData.setMonthHours(128.5);
        
        List<TimeTrackingDTO.TimeEntryDTO> entries = new ArrayList<>();
        
        TimeTrackingDTO.TimeEntryDTO entry1 = new TimeTrackingDTO.TimeEntryDTO();
        entry1.setId(1L);
        entry1.setTaskName("Design Landing Page");
        entry1.setProjectName("Website Redesign");
        entry1.setDescription("Working on the main landing page design");
        entry1.setDuration(4.5);
        entry1.setDate("2024-01-15");
        entries.add(entry1);
        
        timeData.setEntries(entries);
        
        return timeData;
    }
}
