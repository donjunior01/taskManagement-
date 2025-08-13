package com.example.gpiApp.service;

import com.example.gpiApp.dto.DailyTaskScheduleDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyTaskScheduleService {
    DailyTaskScheduleDTO createDailyTaskSchedule(DailyTaskScheduleDTO scheduleDTO);
    
    DailyTaskScheduleDTO updateDailyTaskSchedule(Long scheduleId, DailyTaskScheduleDTO scheduleDTO);
    
    void deleteDailyTaskSchedule(Long scheduleId);
    
    Optional<DailyTaskScheduleDTO> getDailyTaskScheduleById(Long scheduleId);
    
    List<DailyTaskScheduleDTO> getAllDailyTaskSchedules();
    
    List<DailyTaskScheduleDTO> getDailyTaskSchedulesByPlanningId(Long planningId);
    
    List<DailyTaskScheduleDTO> getDailyTaskSchedulesByDate(LocalDate date);
    
    List<DailyTaskScheduleDTO> getDailyTaskSchedulesByUserAndDate(Long userId, LocalDate date);
    
    List<DailyTaskScheduleDTO> getDailyTaskSchedulesByUserAndWeek(Long userId, Integer weekNumber, Integer year);
    
    DailyTaskScheduleDTO markTaskAsCompleted(Long scheduleId);
    
    DailyTaskScheduleDTO markTaskAsIncomplete(Long scheduleId);
    
    long countCompletedTasksByPlanningId(Long planningId);
    
    long countPendingTasksByPlanningId(Long planningId);
} 