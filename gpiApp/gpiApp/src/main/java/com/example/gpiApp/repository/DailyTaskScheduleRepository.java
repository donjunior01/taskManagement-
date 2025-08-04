package com.example.gpiApp.repository;

import com.example.gpiApp.entity.DailyTaskSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyTaskScheduleRepository extends JpaRepository<DailyTaskSchedule, UUID> {
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.weeklyPlanning.planningId = :planningId")
    List<DailyTaskSchedule> findByWeeklyPlanningPlanningId(@Param("planningId") UUID planningId);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.task.taskId = :taskId")
    List<DailyTaskSchedule> findByTaskTaskId(@Param("taskId") UUID taskId);
    
    List<DailyTaskSchedule> findByScheduledDate(LocalDate scheduledDate);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.weeklyPlanning.user.userId = :userId AND dts.scheduledDate = :date")
    List<DailyTaskSchedule> findByUserAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.weeklyPlanning.user.userId = :userId AND dts.scheduledDate BETWEEN :startDate AND :endDate")
    List<DailyTaskSchedule> findByUserAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.isCompleted = false AND dts.scheduledDate < :date")
    List<DailyTaskSchedule> findOverdueSchedules(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(dts) FROM DailyTaskSchedule dts WHERE dts.weeklyPlanning.user.userId = :userId AND dts.isCompleted = true")
    long countCompletedSchedulesByUser(@Param("userId") UUID userId);
} 