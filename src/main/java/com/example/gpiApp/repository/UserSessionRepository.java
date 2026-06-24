package com.example.gpiApp.repository;

import com.example.gpiApp.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);

    List<UserSession> findByUserIdAndRevokedFalseOrderByLastSeenAtDesc(Long userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.revoked = true, s.revokedAt = :now WHERE s.user.id = :userId AND s.revoked = false")
    int revokeAllForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE UserSession s SET s.revoked = true, s.revokedAt = :now " +
           "WHERE s.user.id = :userId AND s.revoked = false AND s.sessionId <> :keepSessionId")
    int revokeAllForUserExcept(@Param("userId") Long userId, @Param("keepSessionId") String keepSessionId, @Param("now") LocalDateTime now);
}
