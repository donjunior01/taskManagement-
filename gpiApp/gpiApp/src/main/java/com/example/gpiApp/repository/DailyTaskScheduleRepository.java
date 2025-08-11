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

    // Changed from 'weeklyPlanning' to 'planning'
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.planningId = :planningId")
    List<DailyTaskSchedule> findByWeeklyPlanningPlanningId(@Param("planningId") Long planningId);

    // Changed from 'task.taskId' to match your Task entity's ID field
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.task.taskId = :taskId")
    List<DailyTaskSchedule> findByTaskTaskId(@Param("taskId") Long taskId);

    List<DailyTaskSchedule> findByScheduledDate(LocalDate scheduledDate);

    // Changed from 'weeklyPlanning' to 'planning'
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.user.userId = :userId AND dts.scheduledDate = :date")
    List<DailyTaskSchedule> findByUserAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    // Changed from 'weeklyPlanning' to 'planning'
    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.planning.user.userId = :userId AND dts.scheduledDate BETWEEN :startDate AND :endDate")
    List<DailyTaskSchedule> findByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT dts FROM DailyTaskSchedule dts WHERE dts.isCompleted = false AND dts.scheduledDate < :date")
    List<DailyTaskSchedule> findOverdueSchedules(@Param("date") LocalDate date);

    // Changed from 'weeklyPlanning' to 'planning'
    @Query("SELECT COUNT(dts) FROM DailyTaskSchedule dts WHERE dts.planning.user.userId = :userId AND dts.isCompleted = true")
    long countCompletedSchedulesByUser(@Param("userId") Long userId);

    // Alternative: Using Spring Data method naming (no @Query needed)
    // These methods will work based on your entity structure:
    List<DailyTaskSchedule> findByPlanningPlanningId(Long planningId);
    long countByPlanningUserUserIdAndIsCompletedTrue(Long userId);
}