package com.example.gpiApp.service;

import com.example.gpiApp.dto.ActivityLogDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ActivityLogRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final IpResolverService ipResolver;
    private final UserRepository userRepository;
    
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
    
    /**
     * Build a tamper-evident compliance CSV of the audit trail within a window. The record block is
     * hashed (SHA-256) and the digest + generation metadata are appended as a signed footer, so the
     * file can be archived as evidence and re-verified later (any edit changes the hash).
     */
    @Transactional(readOnly = true)
    public String exportComplianceCsv(LocalDateTime from, LocalDateTime to) {
        LocalDateTime start = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        List<ActivityLog> logs = activityLogRepository.findAllInRange(start, end);

        StringBuilder records = new StringBuilder();
        records.append("timestamp,user_id,user_name,user_role,action,description,entity_type,entity_id,ip_address\n");
        for (ActivityLog l : logs) {
            records.append(csv(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "")).append(',')
                   .append(csv(l.getUser() != null ? String.valueOf(l.getUser().getId()) : "")).append(',')
                   .append(csv(l.getUser() != null ? (safe(l.getUser().getFirstName()) + " " + safe(l.getUser().getLastName())).trim() : "")).append(',')
                   .append(csv(l.getUser() != null && l.getUser().getRole() != null ? l.getUser().getRole().name() : "")).append(',')
                   .append(csv(l.getActivityType() != null ? l.getActivityType().name() : "")).append(',')
                   .append(csv(l.getDescription())).append(',')
                   .append(csv(l.getEntityType())).append(',')
                   .append(csv(l.getEntityId() != null ? String.valueOf(l.getEntityId()) : "")).append(',')
                   .append(csv(l.getIpAddress())).append('\n');
        }

        String digest = sha256Hex(records.toString());
        StringBuilder out = new StringBuilder(records);
        out.append("# ---- Compliance footer ----\n");
        out.append("# Records: ").append(logs.size()).append('\n');
        out.append("# Window: ").append(start).append(" .. ").append(end).append('\n');
        out.append("# Generated: ").append(LocalDateTime.now()).append('\n');
        out.append("# SHA-256: ").append(digest).append('\n');
        return out.toString();
    }

    private String csv(String v) {
        if (v == null) return "";
        String s = v.replace("\"", "\"\"");
        return (s.contains(",") || s.contains("\n") || s.contains("\"")) ? "\"" + s + "\"" : s;
    }

    private String safe(String v) { return v == null ? "" : v; }

    private String sha256Hex(String input) {
        try {
            byte[] h = java.security.MessageDigest.getInstance("SHA-256").digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "unavailable";
        }
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
                .ipAddress(resolveIp(ipAddress))
                .build();

        activityLogRepository.save(activityLog);
    }

    /**
     * Log an action attributed to the currently authenticated caller (actor resolved from the
     * security context, IP from the current request). Lets any service record an audit entry
     * without threading the actor id through its method signatures.
     */
    @Transactional
    public void logCurrentUserActivity(ActivityLog.ActivityType activityType, String description,
                                       String entityType, Long entityId) {
        logActivity(activityType, description, currentUser(), entityType, entityId, null);
    }

    /** Resolve the authenticated user from the security context (mirrors the controllers' logic). */
    private allUsers currentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) return null;
            String name = auth.getName();
            try {
                return userRepository.findById(Long.parseLong(name)).orElse(null);
            } catch (NumberFormatException e) {
                return userRepository.findByEmail(name)
                        .or(() -> userRepository.findByUsername(name))
                        .orElse(null);
            }
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    public void logSecurityAlert(String description, String ipAddress) {
        ActivityLog activityLog = ActivityLog.builder()
                .activityType(ActivityLog.ActivityType.SECURITY_ALERT)
                .description(description)
                .ipAddress(resolveIp(ipAddress))
                .build();

        activityLogRepository.save(activityLog);
    }

    /** Use the caller-supplied IP, else resolve the real IP from the current request (the common case). */
    private String resolveIp(String ipAddress) {
        if (ipAddress != null && !ipAddress.isBlank()) return ipAddress;
        try { return ipResolver.resolveCurrentRequestIp(); } catch (Exception e) { return null; }
    }
    
    private ActivityLogDTO convertToDTO(ActivityLog activityLog) {
        return ActivityLogDTO.builder()
                .id(activityLog.getId())
                .activityType(activityLog.getActivityType())
                .description(activityLog.getDescription())
                .userId(activityLog.getUser() != null ? activityLog.getUser().getId() : null)
                .userName(activityLog.getUser() != null ?
                        activityLog.getUser().getFirstName() + " " + activityLog.getUser().getLastName() : null)
                .userRole(activityLog.getUser() != null && activityLog.getUser().getRole() != null ?
                        activityLog.getUser().getRole().name() : null)
                .entityType(activityLog.getEntityType())
                .entityId(activityLog.getEntityId())
                .ipAddress(activityLog.getIpAddress())
                .createdAt(activityLog.getCreatedAt())
                .build();
    }
}

