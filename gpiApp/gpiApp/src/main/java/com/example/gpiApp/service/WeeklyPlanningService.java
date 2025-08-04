package com.example.gpiApp.service;

import com.example.gpiApp.dto.WeeklyPlanningDTO;
import com.example.gpiApp.entity.WeeklyPlanning;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyPlanningService {
    WeeklyPlanningDTO createWeeklyPlanning(WeeklyPlanningDTO planningDTO);
    
    WeeklyPlanningDTO updateWeeklyPlanning(UUID planningId, WeeklyPlanningDTO planningDTO);
    
    void deleteWeeklyPlanning(UUID planningId);
    
    Optional<WeeklyPlanningDTO> getWeeklyPlanningById(UUID planningId);
    
    List<WeeklyPlanningDTO> getAllWeeklyPlannings();
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsByUser(UUID userId);
    
    Optional<WeeklyPlanningDTO> getWeeklyPlanningByUserAndWeek(UUID userId, Integer weekNumber, Integer year);
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsForDate(LocalDate date);
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsByComplianceStatus(WeeklyPlanning.ComplianceStatus status);
    
    List<WeeklyPlanningDTO> getPendingApprovals();
    
    List<WeeklyPlanningDTO> getApprovedPlanningsByUser(UUID userId);
    
    Optional<WeeklyPlanningDTO> getCurrentWeeklyPlanning();
    
    WeeklyPlanningDTO submitWeeklyPlanning(UUID planningId);
    
    WeeklyPlanningDTO approveWeeklyPlanning(UUID planningId, UUID approverId);
    
    WeeklyPlanningDTO rejectWeeklyPlanning(UUID planningId, UUID approverId, String reason);
    
    long countCompliantPlanningsByUser(UUID userId);
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsInDateRange(LocalDate startDate, LocalDate endDate);
    
    WeeklyPlanningDTO calculateComplianceStatus(UUID planningId);
} 