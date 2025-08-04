package com.example.gpiApp.repository;

import com.example.gpiApp.entity.WeeklyPlanning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeeklyPlanningRepository extends JpaRepository<WeeklyPlanning, UUID> {
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.user.userId = :userId")
    List<WeeklyPlanning> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.user.userId = :userId AND wp.weekNumber = :weekNumber AND wp.year = :year")
    Optional<WeeklyPlanning> findByUserAndWeek(@Param("userId") UUID userId, @Param("weekNumber") Integer weekNumber, @Param("year") Integer year);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.weekStartDate <= :date AND wp.weekEndDate >= :date")
    List<WeeklyPlanning> findPlanningsForDate(@Param("date") LocalDate date);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.complianceStatus = :status")
    List<WeeklyPlanning> findByComplianceStatus(@Param("status") WeeklyPlanning.ComplianceStatus status);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.isApproved = false")
    List<WeeklyPlanning> findPendingApprovals();
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.user.userId = :userId AND wp.isApproved = true")
    List<WeeklyPlanning> findApprovedPlanningsByUser(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(wp) FROM WeeklyPlanning wp WHERE wp.user.userId = :userId AND wp.complianceStatus = 'COMPLIANT'")
    long countCompliantPlanningsByUser(@Param("userId") UUID userId);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.weekStartDate >= :startDate AND wp.weekEndDate <= :endDate")
    List<WeeklyPlanning> findPlanningsInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT wp FROM WeeklyPlanning wp WHERE wp.weekNumber = :weekNumber AND wp.year = :year")
    List<WeeklyPlanning> findByWeekAndYear(@Param("weekNumber") Integer weekNumber, @Param("year") Integer year);
} 