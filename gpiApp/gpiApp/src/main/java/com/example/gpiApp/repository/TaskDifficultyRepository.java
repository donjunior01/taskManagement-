package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskDifficultyRepository extends JpaRepository<TaskDifficulty, Long> {
    @Query("SELECT td FROM TaskDifficulty td WHERE td.task.taskId = :taskId")
    List<TaskDifficulty> findByTaskTaskId(@Param("taskId") Long taskId);
    
    @Query("SELECT td FROM TaskDifficulty td WHERE td.reportedBy.userId = :userId")
    List<TaskDifficulty> findByReportedByUserId(@Param("userId") Long userId);
    
    List<TaskDifficulty> findByIsResolvedFalse();
    
    @Query("SELECT td FROM TaskDifficulty td WHERE td.task.taskId = :taskId AND td.isResolved = false")
    List<TaskDifficulty> findUnresolvedDifficultiesByTask(@Param("taskId") Long taskId);
    
    @Query("SELECT td FROM TaskDifficulty td WHERE td.impactLevel = :impactLevel")
    List<TaskDifficulty> findByImpactLevel(@Param("impactLevel") TaskDifficulty.ImpactLevel impactLevel);
    
    @Query("SELECT td FROM TaskDifficulty td WHERE td.criticalityLevel = :criticalityLevel")
    List<TaskDifficulty> findByCriticalityLevel(@Param("criticalityLevel") TaskDifficulty.CriticalityLevel criticalityLevel);
    
    @Query("SELECT COUNT(td) FROM TaskDifficulty td WHERE td.isResolved = false")
    long countUnresolvedDifficulties();
} 