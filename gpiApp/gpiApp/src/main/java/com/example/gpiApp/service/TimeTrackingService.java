package com.example.gpiApp.service;

import com.example.gpiApp.dto.TimeTrackingDTO;

public interface TimeTrackingService {
    TimeTrackingDTO getTimeTrackingDataByUser(String username);
}
