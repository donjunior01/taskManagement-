package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface TaskProgressRepository extends JpaRepository<TaskProgress, Long> {
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC")
    List<TaskProgress> findByTaskTaskIdOrderByUpdatedAtDesc(@Param("taskId") Long taskId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.updatedBy.userId = :userId")
    List<TaskProgress> findByUpdatedByUserId(@Param("userId") Long userId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC")
    List<TaskProgress> findLatestProgressByTask(@Param("taskId") Long taskId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.updatedBy.userId = :userId AND tp.updatedAt >= :startDate")
    List<TaskProgress> findByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC LIMIT 1")
    TaskProgress findLatestProgressForTask(@Param("taskId") Long taskId);
} 