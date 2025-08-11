package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlanningDTO {
    private Long planningId;
    private Long userId;
    private String userName;
    private Integer weekNumber;
    private Integer year;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private ComplianceStatus complianceStatus;
    private Integer totalTasksPlanned;
    private LocalDateTime submittedAt;
    private Boolean isApproved;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DailyTaskScheduleDTO> dailySchedules;
    private Integer completedTasksCount;
    private Integer pendingTasksCount;

    public enum ComplianceStatus {
        COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT
    }
} 