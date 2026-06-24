package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserSessionDTO;
import com.example.gpiApp.entity.UserSession;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Server-side session registry that makes the stateless JWT revocable. A session row is created on
 * login (its id is the token's {@code jti}); the request filter rejects tokens whose session is
 * revoked; users can list/▾revoke their devices and admins can force-logout an account.
 */
@Service
@RequiredArgsConstructor
public class SessionService {

    private final UserSessionRepository sessionRepository;

    /** Create a session for a fresh login and return its id (embed it in the JWT as the jti). */
    @Transactional
    public String createSession(allUsers user, String ipAddress, String userAgent) {
        String sessionId = UUID.randomUUID().toString().replace("-", "");
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .user(user)
                .ipAddress(ipAddress)
                .device(userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 390)) : null)
                .build();
        sessionRepository.save(session);
        return sessionId;
    }

    /** True if the session backing this token id is still active (exists and not revoked). */
    @Transactional
    public boolean isActiveAndTouch(String sessionId) {
        if (sessionId == null) return false;
        return sessionRepository.findBySessionId(sessionId).map(s -> {
            if (s.isRevoked()) return false;
            // Throttle "last seen" writes to avoid a DB update on every single request.
            LocalDateTime now = LocalDateTime.now();
            if (s.getLastSeenAt() == null || s.getLastSeenAt().isBefore(now.minusMinutes(5))) {
                s.setLastSeenAt(now);
                sessionRepository.save(s);
            }
            return true;
        }).orElse(false);
    }

    @Transactional(readOnly = true)
    public List<UserSessionDTO> listForUser(Long userId, String currentSessionId) {
        return sessionRepository.findByUserIdAndRevokedFalseOrderByLastSeenAtDesc(userId).stream()
                .map(s -> toDTO(s, currentSessionId))
                .collect(Collectors.toList());
    }

    /** Revoke one of the caller's own sessions (ownership enforced). */
    @Transactional
    public void revokeOwn(Long sessionRowId, Long userId) {
        UserSession s = sessionRepository.findById(sessionRowId)
                .orElseThrow(() -> new AccessDeniedException("Session not found"));
        if (s.getUser() == null || !userId.equals(s.getUser().getId())) {
            throw new AccessDeniedException("You can only revoke your own sessions.");
        }
        markRevoked(s);
    }

    /** Revoke a session by its jti (used by logout). */
    @Transactional
    public void revokeBySessionId(String sessionId) {
        if (sessionId == null) return;
        sessionRepository.findBySessionId(sessionId).ifPresent(this::markRevoked);
    }

    /** Sign out every other device of this user, keeping the current session. */
    @Transactional
    public int revokeOthers(Long userId, String keepSessionId) {
        return sessionRepository.revokeAllForUserExcept(userId, keepSessionId == null ? "" : keepSessionId, LocalDateTime.now());
    }

    /** Admin force-logout: revoke ALL of a user's sessions. */
    @Transactional
    public int revokeAllForUser(Long userId) {
        return sessionRepository.revokeAllForUser(userId, LocalDateTime.now());
    }

    private void markRevoked(UserSession s) {
        s.setRevoked(true);
        s.setRevokedAt(LocalDateTime.now());
        sessionRepository.save(s);
    }

    private UserSessionDTO toDTO(UserSession s, String currentSessionId) {
        return UserSessionDTO.builder()
                .id(s.getId())
                .device(s.getDevice())
                .ipAddress(s.getIpAddress())
                .createdAt(s.getCreatedAt())
                .lastSeenAt(s.getLastSeenAt())
                .current(s.getSessionId() != null && s.getSessionId().equals(currentSessionId))
                .build();
    }
}
