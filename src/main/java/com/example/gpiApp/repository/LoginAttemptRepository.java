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
    
    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE DATE(l.attemptedAt) = CURRENT_DATE")
    Long countTodayLoginAttempts();
    
    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.status = :status AND DATE(l.attemptedAt) = CURRENT_DATE")
    Long countTodayFailedLogins(@Param("status") LoginAttempt.LoginStatus status);
    
    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.status = :status AND DATE(l.attemptedAt) = CURRENT_DATE")
    Long countTodaySuccessfulLogins(@Param("status") LoginAttempt.LoginStatus status);
    
    List<LoginAttempt> findByAttemptedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT l FROM LoginAttempt l WHERE l.user.id = :userId ORDER BY l.attemptedAt DESC")
    List<LoginAttempt> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(DISTINCT l.user.id) FROM LoginAttempt l WHERE l.status = :status AND l.attemptedAt >= :since")
    Long countActiveSessionsSince(@Param("since") LocalDateTime since, @Param("status") LoginAttempt.LoginStatus status);
}

