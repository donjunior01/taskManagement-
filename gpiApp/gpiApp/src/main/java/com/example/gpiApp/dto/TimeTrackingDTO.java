package com.example.gpiApp.dto;

import lombok.Data;
import java.util.List;

@Data
public class TimeTrackingDTO {
    private Double todayHours;
    private Double weekHours;
    private Double monthHours;
    private List<TimeEntryDTO> entries;
    
    @Data
    public static class TimeEntryDTO {
        private Long id;
        private String taskName;
        private String projectName;
        private String description;
        private Double duration;
        private String date;
    }
}
