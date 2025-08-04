package com.example.gpiApp.dto;

import com.example.gpiApp.entity.DailyTaskSchedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskScheduleDTO {
    private UUID scheduleId;
    private UUID planningId;
    private UUID taskId;
    private String taskTitle;
    private LocalDate scheduledDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer estimatedDurationMinutes;
    private DailyTaskSchedule.DayOfWeek dayOfWeek;
    private Boolean isCompleted;
} 