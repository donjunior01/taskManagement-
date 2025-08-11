package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @Query("SELECT t FROM Task t WHERE t.createdBy.userId = :userId")
    List<Task> findByCreatedByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Task t WHERE t.project.projectId = :projectId")
    List<Task> findByProjectProjectId(@Param("projectId") Long projectId);
    
    List<Task> findByStatus(Task.TaskStatus status);
    
    List<Task> findByTaskType(Task.TaskType taskType);
    
    @Query("SELECT t FROM Task t WHERE t.createdBy.userId = :userId AND t.status = :status")
    List<Task> findByCreatorAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.dueDate < :date AND t.status NOT IN ('COMPLETED', 'APPROVED')")
    List<Task> findOverdueTasks(@Param("date") LocalDate date);
    
    @Query("SELECT t FROM Task t WHERE t.createdBy.userId = :userId AND t.dueDate BETWEEN :startDate AND :endDate")
    List<Task> findTasksByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT t FROM Task t WHERE t.project.team.teamId = :teamId")
    List<Task> findTasksByTeam(@Param("teamId") Long teamId);
    
    @Query("SELECT t FROM Task t WHERE t.difficultyLevel = :difficulty")
    List<Task> findByDifficultyLevel(@Param("difficulty") Task.DifficultyLevel difficulty);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = :status")
    long countTasksByStatus(@Param("status") Task.TaskStatus status);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.createdBy.userId = :userId AND t.status = :status")
    long countTasksByUserAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.project.projectId = :projectId")
    Page<Task> findByProjectProjectId(@Param("projectId") Long projectId, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.title LIKE %:keyword% OR t.description LIKE %:keyword%")
    List<Task> searchTasksByKeyword(@Param("keyword") String keyword);
} 