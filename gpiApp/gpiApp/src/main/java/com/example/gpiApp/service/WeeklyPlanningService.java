package com.example.gpiApp.service;

import com.example.gpiApp.dto.WeeklyPlanningDTO;

import java.util.List;
import java.util.Optional;

public interface WeeklyPlanningService {
    WeeklyPlanningDTO createWeeklyPlanning(WeeklyPlanningDTO weeklyPlanningDTO);
    
    WeeklyPlanningDTO updateWeeklyPlanning(Long planningId, WeeklyPlanningDTO planningDTO);
    
    void deleteWeeklyPlanning(Long planningId);
    
    Optional<WeeklyPlanningDTO> getWeeklyPlanningById(Long planningId);
    
    List<WeeklyPlanningDTO> getAllWeeklyPlannings();
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsByUser(Long userId);
    
    Optional<WeeklyPlanningDTO> getWeeklyPlanningByUserAndWeek(Long userId, Integer weekNumber, Integer year);
    
    List<WeeklyPlanningDTO> getWeeklyPlanningsByStatus(WeeklyPlanningDTO.ComplianceStatus status);
    
    List<WeeklyPlanningDTO> getPendingApprovals();
    
    List<WeeklyPlanningDTO> getApprovedPlanningsByUser(Long userId);
    
    List<WeeklyPlanningDTO> getCompliantPlanningsByUser(Long userId);
    
    WeeklyPlanningDTO submitWeeklyPlanning(Long planningId);
    
    WeeklyPlanningDTO approveWeeklyPlanning(Long planningId, Long approverId);
    
    WeeklyPlanningDTO rejectWeeklyPlanning(Long planningId, Long approverId, String reason);
    
    long countPlanningsByUser(Long userId);
    
    long countCompliantPlanningsByUser(Long userId);
    
    double calculateComplianceRate(Long userId);
    
    WeeklyPlanningDTO calculateComplianceStatus(Long planningId);
} 