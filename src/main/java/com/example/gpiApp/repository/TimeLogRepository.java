package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.TimeLog;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    
    Page<TimeLog> findByTask(Task task, Pageable pageable);
    
    List<TimeLog> findByTask(Task task);
    
    Page<TimeLog> findByUser(allUsers user, Pageable pageable);
    
    List<TimeLog> findByUser(allUsers user);
    
    @Query("SELECT t FROM TimeLog t WHERE t.task.id = :taskId ORDER BY t.logDate DESC")
    Page<TimeLog> findByTaskId(@Param("taskId") Long taskId, Pageable pageable);
    
    @Query("SELECT t FROM TimeLog t WHERE t.user.id = :userId ORDER BY t.logDate DESC")
    Page<TimeLog> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT SUM(t.hoursSpent) FROM TimeLog t WHERE t.task.id = :taskId")
    Double getTotalHoursByTaskId(@Param("taskId") Long taskId);
    
    @Query("SELECT SUM(t.hoursSpent) FROM TimeLog t WHERE t.user.id = :userId")
    Double getTotalHoursByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM TimeLog t WHERE t.user.id = :userId AND t.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT SUM(t.hoursSpent) FROM TimeLog t WHERE t.user.id = :userId AND t.logDate BETWEEN :startDate AND :endDate")
    Double getTotalHoursByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

