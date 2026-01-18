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
    
    Page<LoginAttempt> findAll(Pageable pageable);
    
    Page<LoginAttempt> findByUsername(String username, Pageable pageable);
    
    Page<LoginAttempt> findByStatus(LoginAttempt.LoginStatus status, Pageable pageable);
    
    @Query("SELECT la FROM LoginAttempt la WHERE la.attemptedAt BETWEEN :start AND :end ORDER BY la.attemptedAt DESC")
    Page<LoginAttempt> findLoginAttemptsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
    
    List<LoginAttempt> findByUsernameAndStatusAndAttemptedAtAfter(String username, LoginAttempt.LoginStatus status, LocalDateTime after);
    
    long countByStatusAndAttemptedAtAfter(LoginAttempt.LoginStatus status, LocalDateTime after);
}
