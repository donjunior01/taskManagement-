package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.TimeLog;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.TimeLogRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeLogService {
    
    private final TimeLogRepository timeLogRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    
    @Transactional(readOnly = true)
    public PagedResponse<TimeLogDTO> getAllTimeLogs(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<TimeLog> timeLogPage = timeLogRepository.findAll(pageable);
        
        List<TimeLogDTO> timeLogDTOs = timeLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(timeLogDTOs, timeLogPage.getNumber(), timeLogPage.getSize(),
                timeLogPage.getTotalElements(), timeLogPage.getTotalPages(),
                timeLogPage.isFirst(), timeLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<TimeLogDTO> getTimeLogById(Long id) {
        return timeLogRepository.findById(id)
                .map(timeLog -> ApiResponse.success("Time log retrieved successfully", convertToDTO(timeLog)))
                .orElse(ApiResponse.error("Time log not found"));
    }
    
    @Transactional
    public ApiResponse<TimeLogDTO> createTimeLog(TimeLogRequestDTO request, Long userId) {
        TimeLog timeLog = new TimeLog();
        timeLog.setHoursSpent(request.getHoursSpent());
        timeLog.setLogDate(request.getLogDate());
        timeLog.setDescription(request.getDescription());
        
        taskRepository.findById(request.getTaskId())
                .ifPresent(timeLog::setTask);
        
        userRepository.findById(userId)
                .ifPresent(timeLog::setUser);
        
        TimeLog savedTimeLog = timeLogRepository.save(timeLog);
        
        // Log activity
        userRepository.findById(userId).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.TIME_LOGGED,
                "Logged " + request.getHoursSpent() + " hours for task",
                user,
                "TIMELOG",
                savedTimeLog.getId(),
                null
            )
        );
        
        return ApiResponse.success("Time log created successfully", convertToDTO(savedTimeLog));
    }
    
    @Transactional
    public ApiResponse<TimeLogDTO> updateTimeLog(Long id, TimeLogRequestDTO request) {
        return timeLogRepository.findById(id)
                .map(timeLog -> {
                    timeLog.setHoursSpent(request.getHoursSpent());
                    timeLog.setLogDate(request.getLogDate());
                    timeLog.setDescription(request.getDescription());
                    
                    if (request.getTaskId() != null) {
                        taskRepository.findById(request.getTaskId())
                                .ifPresent(timeLog::setTask);
                    }
                    
                    TimeLog updatedTimeLog = timeLogRepository.save(timeLog);
                    return ApiResponse.success("Time log updated successfully", convertToDTO(updatedTimeLog));
                })
                .orElse(ApiResponse.error("Time log not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteTimeLog(Long id) {
        return timeLogRepository.findById(id)
                .map(timeLog -> {
                    timeLogRepository.delete(timeLog);
                    return ApiResponse.<Void>success("Time log deleted successfully", null);
                })
                .orElse(ApiResponse.error("Time log not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TimeLogDTO> getTimeLogsByTask(Long taskId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<TimeLog> timeLogPage = timeLogRepository.findByTaskId(taskId, pageable);
        
        List<TimeLogDTO> timeLogDTOs = timeLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(timeLogDTOs, timeLogPage.getNumber(), timeLogPage.getSize(),
                timeLogPage.getTotalElements(), timeLogPage.getTotalPages(),
                timeLogPage.isFirst(), timeLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TimeLogDTO> getTimeLogsByUser(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<TimeLog> timeLogPage = timeLogRepository.findByUserId(userId, pageable);
        
        List<TimeLogDTO> timeLogDTOs = timeLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(timeLogDTOs, timeLogPage.getNumber(), timeLogPage.getSize(),
                timeLogPage.getTotalElements(), timeLogPage.getTotalPages(),
                timeLogPage.isFirst(), timeLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<Double> getTotalHoursByTask(Long taskId) {
        Double totalHours = timeLogRepository.getTotalHoursByTaskId(taskId);
        return ApiResponse.success("Total hours retrieved", totalHours != null ? totalHours : 0.0);
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<Double> getTotalHoursByUser(Long userId) {
        Double totalHours = timeLogRepository.getTotalHoursByUserId(userId);
        return ApiResponse.success("Total hours retrieved", totalHours != null ? totalHours : 0.0);
    }
    
    @Transactional(readOnly = true)
    public List<TimeLogDTO> getTimeLogsByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        List<TimeLog> timeLogs = timeLogRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        return timeLogs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private TimeLogDTO convertToDTO(TimeLog timeLog) {
        return TimeLogDTO.builder()
                .id(timeLog.getId())
                .taskId(timeLog.getTask() != null ? timeLog.getTask().getId() : null)
                .taskName(timeLog.getTask() != null ? timeLog.getTask().getName() : null)
                .userId(timeLog.getUser() != null ? timeLog.getUser().getId() : null)
                .userName(timeLog.getUser() != null ? 
                        timeLog.getUser().getFirstName() + " " + timeLog.getUser().getLastName() : null)
                .hoursSpent(timeLog.getHoursSpent())
                .logDate(timeLog.getLogDate())
                .description(timeLog.getDescription())
                .createdAt(timeLog.getCreatedAt())
                .updatedAt(timeLog.getUpdatedAt())
                .build();
    }
}

