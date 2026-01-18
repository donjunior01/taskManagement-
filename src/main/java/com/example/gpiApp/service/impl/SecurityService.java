package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.*;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecurityService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserSessionRepository userSessionRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void recordLoginAttempt(String username, String ipAddress, LoginAttempt.LoginStatus status, String reason) {
        allUsers user = userRepository.findByUsername(username).orElse(null);
        
        LoginAttempt attempt = LoginAttempt.builder()
                .user(user)
                .username(username)
                .ipAddress(ipAddress)
                .status(status)
                .reason(reason)
                .build();
        
        loginAttemptRepository.save(attempt);
        
        // Check for multiple failed attempts and create security alert if needed
        if (status == LoginAttempt.LoginStatus.FAILED) {
            List<LoginAttempt> recentFailedAttempts = loginAttemptRepository
                    .findByUsernameAndStatusAndAttemptedAtAfter(
                            username,
                            LoginAttempt.LoginStatus.FAILED,
                            LocalDateTime.now().minusHours(1)
                    );
            
            if (recentFailedAttempts.size() >= 5) {
                createSecurityAlert(
                        user,
                        SecurityAlert.AlertType.MULTIPLE_FAILED_LOGINS,
                        "Multiple failed login attempts detected for user: " + username,
                        ipAddress,
                        SecurityAlert.Severity.HIGH
                );
            }
        }
    }
    
    @Transactional
    public UserSessionDTO createUserSession(Long userId, String sessionToken, String ipAddress, String userAgent, String deviceType) {
        allUsers user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserSession session = UserSession.builder()
                .user(user)
                .sessionToken(sessionToken)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceType(deviceType)
                .build();
        
        UserSession savedSession = userSessionRepository.save(session);
        
        return convertSessionToDTO(savedSession);
    }
    
    @Transactional
    public void closeUserSession(String sessionToken) {
        userSessionRepository.findBySessionToken(sessionToken).ifPresent(session -> {
            session.setLogoutTime(LocalDateTime.now());
            session.setIsActive(false);
            userSessionRepository.save(session);
        });
    }
    
    @Transactional(readOnly = true)
    public List<UserSessionDTO> getActiveSessionsForUser(Long userId) {
        return userSessionRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::convertSessionToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<UserSessionDTO> getAllActiveSessions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("loginTime").descending());
        Page<UserSession> sessionPage = userSessionRepository.findByIsActiveTrue(pageable);
        
        List<UserSessionDTO> dtos = sessionPage.getContent().stream()
                .map(this::convertSessionToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, sessionPage.getTotalElements(),
                sessionPage.getTotalPages(), sessionPage.isFirst(), sessionPage.isLast());
    }
    
    @Transactional
    public void createSecurityAlert(allUsers user, SecurityAlert.AlertType alertType, 
                                   String description, String ipAddress, SecurityAlert.Severity severity) {
        SecurityAlert alert = SecurityAlert.builder()
                .user(user)
                .alertType(alertType)
                .description(description)
                .ipAddress(ipAddress)
                .severity(severity)
                .build();
        
        securityAlertRepository.save(alert);
    }
    
    @Transactional
    public void resolveSecurityAlert(Long alertId) {
        securityAlertRepository.findById(alertId).ifPresent(alert -> {
            alert.setIsResolved(true);
            alert.setResolvedAt(LocalDateTime.now());
            securityAlertRepository.save(alert);
        });
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<SecurityAlertDTO> getAllSecurityAlerts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SecurityAlert> alertPage = securityAlertRepository.findAll(pageable);
        
        List<SecurityAlertDTO> dtos = alertPage.getContent().stream()
                .map(this::convertAlertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, alertPage.getTotalElements(),
                alertPage.getTotalPages(), alertPage.isFirst(), alertPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<SecurityAlertDTO> getUnresolvedAlerts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SecurityAlert> alertPage = securityAlertRepository.findByIsResolvedFalse(pageable);
        
        List<SecurityAlertDTO> dtos = alertPage.getContent().stream()
                .map(this::convertAlertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, alertPage.getTotalElements(),
                alertPage.getTotalPages(), alertPage.isFirst(), alertPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<LoginAttemptDTO> getLoginAttempts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("attemptedAt").descending());
        Page<LoginAttempt> attemptPage = loginAttemptRepository.findAll(pageable);
        
        List<LoginAttemptDTO> dtos = attemptPage.getContent().stream()
                .map(this::convertAttemptToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, attemptPage.getTotalElements(),
                attemptPage.getTotalPages(), attemptPage.isFirst(), attemptPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<LoginAttemptDTO> getFailedLoginAttempts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("attemptedAt").descending());
        Page<LoginAttempt> attemptPage = loginAttemptRepository.findByStatus(
                LoginAttempt.LoginStatus.FAILED, pageable);
        
        List<LoginAttemptDTO> dtos = attemptPage.getContent().stream()
                .map(this::convertAttemptToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, attemptPage.getTotalElements(),
                attemptPage.getTotalPages(), attemptPage.isFirst(), attemptPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public long getActiveSessionCount() {
        return userSessionRepository.countByIsActiveTrue();
    }
    
    @Transactional(readOnly = true)
    public long getTodayFailedLoginCount() {
        return loginAttemptRepository.countByStatusAndAttemptedAtAfter(
                LoginAttempt.LoginStatus.FAILED,
                LocalDateTime.now().minusDays(1)
        );
    }
    
    @Transactional(readOnly = true)
    public long getUnresolvedAlertCount() {
        return securityAlertRepository.countByIsResolvedFalse();
    }
    
    private UserSessionDTO convertSessionToDTO(UserSession session) {
        long durationMinutes = 0;
        if (session.getLogoutTime() != null) {
            durationMinutes = java.time.temporal.ChronoUnit.MINUTES.between(
                    session.getLoginTime(), session.getLogoutTime());
        } else if (session.getIsActive()) {
            durationMinutes = java.time.temporal.ChronoUnit.MINUTES.between(
                    session.getLoginTime(), LocalDateTime.now());
        }
        
        return UserSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .username(session.getUser().getUsername())
                .ipAddress(session.getIpAddress())
                .userAgent(session.getUserAgent())
                .deviceType(session.getDeviceType())
                .loginTime(session.getLoginTime())
                .lastActivity(session.getLastActivity())
                .logoutTime(session.getLogoutTime())
                .isActive(session.getIsActive())
                .durationMinutes(durationMinutes)
                .build();
    }
    
    private SecurityAlertDTO convertAlertToDTO(SecurityAlert alert) {
        return SecurityAlertDTO.builder()
                .id(alert.getId())
                .userId(alert.getUser() != null ? alert.getUser().getId() : null)
                .username(alert.getUser() != null ? alert.getUser().getUsername() : "Unknown")
                .alertType(alert.getAlertType())
                .description(alert.getDescription())
                .ipAddress(alert.getIpAddress())
                .severity(alert.getSeverity())
                .isResolved(alert.getIsResolved())
                .createdAt(alert.getCreatedAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
    
    private LoginAttemptDTO convertAttemptToDTO(LoginAttempt attempt) {
        return LoginAttemptDTO.builder()
                .id(attempt.getId())
                .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                .username(attempt.getUsername())
                .ipAddress(attempt.getIpAddress())
                .status(attempt.getStatus())
                .attemptedAt(attempt.getAttemptedAt())
                .reason(attempt.getReason())
                .build();
    }
}
