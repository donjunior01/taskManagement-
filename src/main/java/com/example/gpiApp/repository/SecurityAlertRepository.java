package com.example.gpiApp.repository;

import com.example.gpiApp.entity.SecurityAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {
    
    Page<SecurityAlert> findAll(Pageable pageable);
    
    Page<SecurityAlert> findByUserId(Long userId, Pageable pageable);
    
    Page<SecurityAlert> findBySeverity(SecurityAlert.Severity severity, Pageable pageable);
    
    Page<SecurityAlert> findByIsResolvedFalse(Pageable pageable);
    
    @Query("SELECT sa FROM SecurityAlert sa WHERE sa.createdAt BETWEEN :start AND :end ORDER BY sa.createdAt DESC")
    Page<SecurityAlert> findAlertsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
    
    List<SecurityAlert> findByAlertTypeAndCreatedAtAfter(SecurityAlert.AlertType alertType, LocalDateTime after);
    
    long countByIsResolvedFalse();
    
    long countByCreatedAtAfter(LocalDateTime after);
}
