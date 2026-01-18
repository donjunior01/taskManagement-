package com.example.gpiApp.repository;

import com.example.gpiApp.entity.UserSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    Optional<UserSession> findBySessionToken(String sessionToken);
    
    List<UserSession> findByUserId(Long userId);
    
    List<UserSession> findByUserIdAndIsActiveTrue(Long userId);
    
    Page<UserSession> findByIsActiveTrue(Pageable pageable);
    
    Page<UserSession> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT us FROM UserSession us WHERE us.lastActivity < :threshold AND us.isActive = true")
    List<UserSession> findInactiveSessions(@Param("threshold") LocalDateTime threshold);
    
    long countByIsActiveTrue();
    
    long countByUserIdAndIsActiveTrue(Long userId);
}
