package com.example.gpiApp.repository;

import com.example.gpiApp.entity.DailyTaskSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyTaskScheduleRepository extends JpaRepository<DailyTaskSchedule, Long> {
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.planningId = :planningId")
    List<DailyTaskSchedule> findByPlanningPlanningId(@Param("planningId") Long planningId);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.scheduledDate = :date")
    List<DailyTaskSchedule> findByScheduledDate(@Param("date") LocalDate date);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.user.userId = :userId AND dts.scheduledDate = :date")
    List<DailyTaskSchedule> findByPlanningUserUserIdAndScheduledDate(@Param("userId") Long userId, @Param("date") LocalDate date);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.user.userId = :userId AND dts.planning.weekNumber = :weekNumber AND dts.planning.year = :year")
    List<DailyTaskSchedule> findByPlanningUserUserIdAndPlanningWeekNumberAndPlanningYear(
            @Param("userId") Long userId, 
            @Param("weekNumber") Integer weekNumber, 
            @Param("year") Integer year);
    
    @Query("SELECT COUNT(dts) FROM DailyTaskSchedule dts WHERE dts.planning.planningId = :planningId AND dts.isCompleted = true")
    long countByPlanningPlanningIdAndIsCompletedTrue(@Param("planningId") Long planningId);
    
    @Query("SELECT COUNT(dts) FROM DailyTaskSchedule dts WHERE dts.planning.planningId = :planningId AND dts.isCompleted = false")
    long countByPlanningPlanningIdAndIsCompletedFalse(@Param("planningId") Long planningId);
}