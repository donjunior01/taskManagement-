package com.example.gpiApp.repository;

import com.example.gpiApp.entity.LoginAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    Page<LoginAttempt> findAllByOrderByAttemptedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.attemptedAt >= :startOfDay")
    Long countTodayLoginAttempts(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.status = :status AND l.attemptedAt >= :startOfDay")
    Long countTodayFailedLogins(@Param("status") LoginAttempt.LoginStatus status, @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.status = :status AND l.attemptedAt >= :startOfDay")
    Long countTodaySuccessfulLogins(@Param("status") LoginAttempt.LoginStatus status, @Param("startOfDay") LocalDateTime startOfDay);

    List<LoginAttempt> findByAttemptedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT l FROM LoginAttempt l WHERE l.user.id = :userId ORDER BY l.attemptedAt DESC")
    List<LoginAttempt> findByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT l.user.id) FROM LoginAttempt l WHERE l.status = :status AND l.attemptedAt >= :since AND l.user IS NOT NULL")
    Long countActiveSessionsSince(@Param("since") LocalDateTime since, @Param("status") LoginAttempt.LoginStatus status);

    /** Suspicious IPs: failed attempts grouped by IP address (most attempts first). */
    @Query("SELECT new com.example.gpiApp.dto.SuspiciousIpDTO(l.ipAddress, COUNT(l), MAX(l.attemptedAt), COUNT(DISTINCT l.username)) " +
           "FROM LoginAttempt l WHERE l.status = :status AND l.ipAddress IS NOT NULL AND l.ipAddress <> '' " +
           "GROUP BY l.ipAddress ORDER BY COUNT(l) DESC")
    List<com.example.gpiApp.dto.SuspiciousIpDTO> findSuspiciousIps(@Param("status") LoginAttempt.LoginStatus status);
}
