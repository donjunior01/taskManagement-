package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskProgressRepository extends JpaRepository<TaskProgress, UUID> {
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC")
    List<TaskProgress> findByTaskTaskIdOrderByUpdatedAtDesc(@Param("taskId") UUID taskId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.updatedBy.userId = :userId")
    List<TaskProgress> findByUpdatedByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC")
    List<TaskProgress> findLatestProgressByTask(@Param("taskId") UUID taskId);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.updatedBy.userId = :userId AND tp.updatedAt >= :startDate")
    List<TaskProgress> findByUserAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.task.taskId = :taskId ORDER BY tp.updatedAt DESC LIMIT 1")
    TaskProgress findLatestProgressForTask(@Param("taskId") UUID taskId);
} 