package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.DailyTaskScheduleDTO;
import com.example.gpiApp.entity.DailyTaskSchedule;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.WeeklyPlanning;
import com.example.gpiApp.repository.DailyTaskScheduleRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.WeeklyPlanningRepository;
import com.example.gpiApp.service.DailyTaskScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DailyTaskScheduleServiceImpl implements DailyTaskScheduleService {
    
    private final DailyTaskScheduleRepository dailyTaskScheduleRepository;
    private final TaskRepository taskRepository;
    private final WeeklyPlanningRepository weeklyPlanningRepository;
    
    @Override
    public DailyTaskScheduleDTO createDailyTaskSchedule(DailyTaskScheduleDTO scheduleDTO) {
        Task task = taskRepository.findById(scheduleDTO.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        WeeklyPlanning planning = weeklyPlanningRepository.findById(scheduleDTO.getPlanningId())
                .orElseThrow(() -> new RuntimeException("Weekly Planning not found"));
        
        DailyTaskSchedule schedule = DailyTaskSchedule.builder()
                .planning(planning)
                .task(task)
                .scheduledDate(scheduleDTO.getScheduledDate())
                .startTime(scheduleDTO.getStartTime())
                .endTime(scheduleDTO.getEndTime())
                .estimatedDurationMinutes(scheduleDTO.getEstimatedDurationMinutes())
                .dayOfWeek(scheduleDTO.getDayOfWeek().name())
                .isCompleted(scheduleDTO.getIsCompleted())
                .build();
        
        DailyTaskSchedule savedSchedule = dailyTaskScheduleRepository.save(schedule);
        return convertToDTO(savedSchedule);
    }
    
    @Override
    public DailyTaskScheduleDTO updateDailyTaskSchedule(Long scheduleId, DailyTaskScheduleDTO scheduleDTO) {
        Optional<DailyTaskSchedule> scheduleOpt = dailyTaskScheduleRepository.findById(scheduleId);
        if (scheduleOpt.isPresent()) {
            DailyTaskSchedule schedule = scheduleOpt.get();
            schedule.setScheduledDate(scheduleDTO.getScheduledDate());
            schedule.setStartTime(scheduleDTO.getStartTime());
            schedule.setEndTime(scheduleDTO.getEndTime());
            schedule.setEstimatedDurationMinutes(scheduleDTO.getEstimatedDurationMinutes());
            schedule.setDayOfWeek(scheduleDTO.getDayOfWeek().name());
            schedule.setIsCompleted(scheduleDTO.getIsCompleted());
            
            DailyTaskSchedule updatedSchedule = dailyTaskScheduleRepository.save(schedule);
            return convertToDTO(updatedSchedule);
        }
        throw new RuntimeException("Daily Task Schedule not found");
    }
    
    @Override
    public void deleteDailyTaskSchedule(Long scheduleId) {
        dailyTaskScheduleRepository.deleteById(scheduleId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<DailyTaskScheduleDTO> getDailyTaskScheduleById(Long scheduleId) {
        return dailyTaskScheduleRepository.findById(scheduleId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DailyTaskScheduleDTO> getAllDailyTaskSchedules() {
        return dailyTaskScheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DailyTaskScheduleDTO> getDailyTaskSchedulesByPlanningId(Long planningId) {
        return dailyTaskScheduleRepository.findByPlanningPlanningId(planningId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DailyTaskScheduleDTO> getDailyTaskSchedulesByDate(LocalDate date) {
        return dailyTaskScheduleRepository.findByScheduledDate(date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DailyTaskScheduleDTO> getDailyTaskSchedulesByUserAndDate(Long userId, LocalDate date) {
        return dailyTaskScheduleRepository.findByPlanningUserUserIdAndScheduledDate(userId, date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DailyTaskScheduleDTO> getDailyTaskSchedulesByUserAndWeek(Long userId, Integer weekNumber, Integer year) {
        return dailyTaskScheduleRepository.findByPlanningUserUserIdAndPlanningWeekNumberAndPlanningYear(userId, weekNumber, year).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public DailyTaskScheduleDTO markTaskAsCompleted(Long scheduleId) {
        Optional<DailyTaskSchedule> scheduleOpt = dailyTaskScheduleRepository.findById(scheduleId);
        if (scheduleOpt.isPresent()) {
            DailyTaskSchedule schedule = scheduleOpt.get();
            schedule.setIsCompleted(true);
            
            DailyTaskSchedule updatedSchedule = dailyTaskScheduleRepository.save(schedule);
            return convertToDTO(updatedSchedule);
        }
        throw new RuntimeException("Daily Task Schedule not found");
    }
    
    @Override
    public DailyTaskScheduleDTO markTaskAsIncomplete(Long scheduleId) {
        Optional<DailyTaskSchedule> scheduleOpt = dailyTaskScheduleRepository.findById(scheduleId);
        if (scheduleOpt.isPresent()) {
            DailyTaskSchedule schedule = scheduleOpt.get();
            schedule.setIsCompleted(false);
            
            DailyTaskSchedule updatedSchedule = dailyTaskScheduleRepository.save(schedule);
            return convertToDTO(updatedSchedule);
        }
        throw new RuntimeException("Daily Task Schedule not found");
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countCompletedTasksByPlanningId(Long planningId) {
        return dailyTaskScheduleRepository.countByPlanningPlanningIdAndIsCompletedTrue(planningId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countPendingTasksByPlanningId(Long planningId) {
        return dailyTaskScheduleRepository.countByPlanningPlanningIdAndIsCompletedFalse(planningId);
    }
    
    private DailyTaskScheduleDTO convertToDTO(DailyTaskSchedule schedule) {
        return DailyTaskScheduleDTO.builder()
                .scheduleId(schedule.getScheduleId())
                .planningId(schedule.getPlanning().getPlanningId())
                .taskId(schedule.getTask().getTaskId())
                .taskTitle(schedule.getTask().getTitle())
                .scheduledDate(schedule.getScheduledDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .estimatedDurationMinutes(schedule.getEstimatedDurationMinutes())
                .dayOfWeek(DailyTaskSchedule.DayOfWeek.valueOf(schedule.getDayOfWeek()))
                .isCompleted(schedule.getIsCompleted())
                .build();
    }
} 