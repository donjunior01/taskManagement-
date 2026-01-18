package com.example.gpiApp.service;

import com.example.gpiApp.dto.ActivityLogDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {
    
    private final ActivityLogRepository activityLogRepository;
    
    @Transactional(readOnly = true)
    public PagedResponse<ActivityLogDTO> getAllActivityLogs(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityLog> activityLogPage = activityLogRepository.findAllOrderByCreatedAtDesc(pageable);
        
        List<ActivityLogDTO> activityLogDTOs = activityLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(activityLogDTOs, activityLogPage.getNumber(), activityLogPage.getSize(),
                activityLogPage.getTotalElements(), activityLogPage.getTotalPages(),
                activityLogPage.isFirst(), activityLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ActivityLogDTO> getActivityLogsByUser(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityLog> activityLogPage = activityLogRepository.findByUserId(userId, pageable);
        
        List<ActivityLogDTO> activityLogDTOs = activityLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(activityLogDTOs, activityLogPage.getNumber(), activityLogPage.getSize(),
                activityLogPage.getTotalElements(), activityLogPage.getTotalPages(),
                activityLogPage.isFirst(), activityLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ActivityLogDTO> getActivityLogsByType(ActivityLog.ActivityType activityType, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityLog> activityLogPage = activityLogRepository.findByActivityType(activityType, pageable);
        
        List<ActivityLogDTO> activityLogDTOs = activityLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(activityLogDTOs, activityLogPage.getNumber(), activityLogPage.getSize(),
                activityLogPage.getTotalElements(), activityLogPage.getTotalPages(),
                activityLogPage.isFirst(), activityLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ActivityLogDTO> getActivityLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityLog> activityLogPage = activityLogRepository.findByDateRange(startDate, endDate, pageable);
        
        List<ActivityLogDTO> activityLogDTOs = activityLogPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(activityLogDTOs, activityLogPage.getNumber(), activityLogPage.getSize(),
                activityLogPage.getTotalElements(), activityLogPage.getTotalPages(),
                activityLogPage.isFirst(), activityLogPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public List<ActivityLogDTO> getActivityLogsByEntity(String entityType, Long entityId) {
        List<ActivityLog> activityLogs = activityLogRepository.findByEntity(entityType, entityId);
        return activityLogs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void logActivity(ActivityLog.ActivityType activityType, String description, allUsers user, 
                           String entityType, Long entityId, String ipAddress) {
        ActivityLog activityLog = ActivityLog.builder()
                .activityType(activityType)
                .description(description)
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .build();
        
        activityLogRepository.save(activityLog);
    }
    
    @Transactional
    public void logSecurityAlert(String description, String ipAddress) {
        ActivityLog activityLog = ActivityLog.builder()
                .activityType(ActivityLog.ActivityType.SECURITY_ALERT)
                .description(description)
                .ipAddress(ipAddress)
                .build();
        
        activityLogRepository.save(activityLog);
    }
    
    private ActivityLogDTO convertToDTO(ActivityLog activityLog) {
        return ActivityLogDTO.builder()
                .id(activityLog.getId())
                .activityType(activityLog.getActivityType())
                .description(activityLog.getDescription())
                .userId(activityLog.getUser() != null ? activityLog.getUser().getId() : null)
                .userName(activityLog.getUser() != null ? 
                        activityLog.getUser().getFirstName() + " " + activityLog.getUser().getLastName() : null)
                .entityType(activityLog.getEntityType())
                .entityId(activityLog.getEntityId())
                .ipAddress(activityLog.getIpAddress())
                .createdAt(activityLog.getCreatedAt())
                .build();
    }
}

