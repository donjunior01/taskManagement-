package com.example.gpiApp.dto;

import com.example.gpiApp.entity.WeeklyPlanning;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlanningDTO {
    private UUID planningId;
    private UUID userId;
    private String userName;
    private Integer weekNumber;
    private Integer year;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private WeeklyPlanning.ComplianceStatus complianceStatus;
    private Integer totalTasksPlanned;
    private LocalDateTime submittedAt;
    private Boolean isApproved;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DailyTaskScheduleDTO> dailySchedules;
    private Integer completedTasksCount;
    private Integer pendingTasksCount;
} 