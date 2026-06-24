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

import java.time.LocalDate;
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
    private final com.example.gpiApp.repository.BlockedIpRepository blockedIpRepository;
    private final IpResolverService ipResolver;
    private final SystemSettingsService systemSettingsService;

    /**
     * How many minutes the given identifier is locked out for after too many recent failed logins
     * (0 = not locked). Enforces the admin "max login attempts" + "lockout duration" settings with a
     * rolling window, so the lock auto-expires as old failures age out.
     */
    @Transactional(readOnly = true)
    public long lockoutRemainingMinutes(String identifier) {
        if (identifier == null || identifier.isBlank()) return 0;
        int maxAttempts;
        int lockoutMinutes;
        try {
            maxAttempts = systemSettingsService.getSettings().getMaxLoginAttempts();
            lockoutMinutes = systemSettingsService.getSettings().getLockoutDurationMinutes();
        } catch (Exception e) {
            return 0; // settings unavailable → don't lock anyone out
        }
        if (maxAttempts <= 0 || lockoutMinutes <= 0) return 0; // feature disabled

        LocalDateTime now = LocalDateTime.now();
        List<LoginAttempt> fails = loginAttemptRepository.findRecentByIdentifier(
                identifier, LoginAttempt.LoginStatus.FAILURE, now.minusMinutes(lockoutMinutes));
        if (fails.size() < maxAttempts) return 0;

        // The failure whose ageing-out drops the count back below the threshold determines the unlock time.
        LocalDateTime pivot = fails.get(fails.size() - maxAttempts).getAttemptedAt();
        LocalDateTime unlockAt = pivot.plusMinutes(lockoutMinutes);
        long seconds = java.time.Duration.between(now, unlockAt).getSeconds();
        return seconds <= 0 ? 0 : (long) Math.ceil(seconds / 60.0);
    }

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

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        Long todayAttempts = loginAttemptRepository.countTodayLoginAttempts(startOfToday);
        Long todayFailed = loginAttemptRepository.countTodayFailedLogins(LoginAttempt.LoginStatus.FAILURE, startOfToday);
        Long todaySuccessful = loginAttemptRepository.countTodaySuccessfulLogins(LoginAttempt.LoginStatus.SUCCESS, startOfToday);
        
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

        // Keys consumed by the admin frontend (SecurityMetrics)
        long blockedIps = recentFailed.stream()
                .map(LoginAttempt::getIpAddress)
                .filter(ip -> ip != null && !ip.isBlank())
                .distinct()
                .count();
        metrics.put("totalAttempts", loginAttemptRepository.count());
        metrics.put("failedAttempts", todayFailed != null ? todayFailed : 0L);
        metrics.put("successfulAttempts", todaySuccessful != null ? todaySuccessful : 0L);
        metrics.put("blockedIps", blockedIps);

        return metrics;
    }
    
    @Transactional(readOnly = true)
    public java.util.List<com.example.gpiApp.dto.SuspiciousIpDTO> getSuspiciousIps() {
        java.util.List<com.example.gpiApp.dto.SuspiciousIpDTO> ips =
                loginAttemptRepository.findSuspiciousIps(LoginAttempt.LoginStatus.FAILURE);
        ips.forEach(ip -> {
            ip.setCountry(ipResolver.lookupCountry(ip.getIpAddress()));   // GeoIP (cached)
            // An IP is "Bloquée" only when an admin has actually blocked it; otherwise it is watched.
            ip.setStatus(blockedIpRepository.existsByIpAddress(ip.getIpAddress()) ? "Bloquée" : "Surveillée");
        });
        return ips;
    }

    // ── IP blocking (admin security console) ──────────────────────────────────
    @Transactional
    public com.example.gpiApp.entity.BlockedIp blockIp(String ipAddress, String reason) {
        if (ipAddress == null || ipAddress.isBlank()) {
            throw new IllegalArgumentException("IP address is required");
        }
        return blockedIpRepository.findByIpAddress(ipAddress).orElseGet(() ->
                blockedIpRepository.save(com.example.gpiApp.entity.BlockedIp.builder()
                        .ipAddress(ipAddress)
                        .reason(reason != null ? reason : "Bloquée depuis la console de sécurité")
                        .build()));
    }

    @Transactional
    public void unblockIp(String ipAddress) {
        if (ipAddress != null) blockedIpRepository.deleteByIpAddress(ipAddress);
    }

    @Transactional(readOnly = true)
    public boolean isIpBlocked(String ipAddress) {
        return ipAddress != null && blockedIpRepository.existsByIpAddress(ipAddress);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.example.gpiApp.entity.BlockedIp> getBlockedIps() {
        return blockedIpRepository.findAll();
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
                .success(attempt.getStatus() == LoginAttempt.LoginStatus.SUCCESS)
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

