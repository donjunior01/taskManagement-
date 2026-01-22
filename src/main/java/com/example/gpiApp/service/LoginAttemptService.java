package com.example.gpiApp.service;

import com.example.gpiApp.dto.LoginAttemptDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.LoginAttempt;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.LoginAttemptRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void logLoginAttempt(String username, String email, LoginAttempt.LoginStatus status, 
                               String ipAddress, String userAgent, String reason, Long userId) {
        LoginAttempt attempt = LoginAttempt.builder()
                .username(username)
                .email(email)
                .status(status)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .reason(reason)
                .user(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .build();
        
        loginAttemptRepository.save(attempt);
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<LoginAttemptDTO> getAllLoginAttempts(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("attemptedAt").descending());
        Page<LoginAttempt> attemptPage = loginAttemptRepository.findAllByOrderByAttemptedAtDesc(pageable);
        
        List<LoginAttemptDTO> dtos = attemptPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, attemptPage.getNumber(), attemptPage.getSize(),
                attemptPage.getTotalElements(), attemptPage.getTotalPages(),
                attemptPage.isFirst(), attemptPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getSecurityMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        Long todayAttempts = loginAttemptRepository.countTodayLoginAttempts();
        Long todayFailed = loginAttemptRepository.countTodayFailedLogins(LoginAttempt.LoginStatus.FAILURE);
        Long todaySuccessful = loginAttemptRepository.countTodaySuccessfulLogins(LoginAttempt.LoginStatus.SUCCESS);
        
        // Active sessions: users who logged in successfully in the last 30 minutes
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        Long activeSessions = loginAttemptRepository.countActiveSessionsSince(thirtyMinutesAgo, LoginAttempt.LoginStatus.SUCCESS);
        
        // Security alerts: failed logins in last 24 hours
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        List<LoginAttempt> recentFailed = loginAttemptRepository.findByAttemptedAtBetween(yesterday, LocalDateTime.now())
                .stream()
                .filter(a -> a.getStatus() == LoginAttempt.LoginStatus.FAILURE)
                .collect(Collectors.toList());
        
        metrics.put("dailyLoginAttempts", todayAttempts != null ? todayAttempts : 0L);
        metrics.put("failedLogins", todayFailed != null ? todayFailed : 0L);
        metrics.put("successfulLogins", todaySuccessful != null ? todaySuccessful : 0L);
        metrics.put("activeSessions", activeSessions != null ? activeSessions : 0L);
        metrics.put("securityAlerts", (long) recentFailed.size());
        
        return metrics;
    }
    
    @Transactional
    public void deleteAllLoginAttempts() {
        loginAttemptRepository.deleteAll();
    }
    
    private LoginAttemptDTO convertToDTO(LoginAttempt attempt) {
        return LoginAttemptDTO.builder()
                .id(attempt.getId())
                .username(attempt.getUsername())
                .email(attempt.getEmail())
                .status(attempt.getStatus())
                .ipAddress(attempt.getIpAddress())
                .userAgent(attempt.getUserAgent())
                .reason(attempt.getReason())
                .attemptedAt(attempt.getAttemptedAt())
                .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                .userName(attempt.getUser() != null ? 
                        attempt.getUser().getFirstName() + " " + attempt.getUser().getLastName() : null)
                .build();
    }
}

