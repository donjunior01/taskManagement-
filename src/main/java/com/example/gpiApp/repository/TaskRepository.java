package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
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
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    Page<Task> findByAssignedTo(allUsers assignedTo, Pageable pageable);
    
    List<Task> findByAssignedTo(allUsers assignedTo);
    
    Page<Task> findByProject(Project project, Pageable pageable);
    
    List<Task> findByProject(Project project);
    
    Page<Task> findByStatus(Task.TaskStatus status, Pageable pageable);
    
    Page<Task> findByPriority(Task.TaskPriority priority, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId")
    Page<Task> findByAssignedToId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId")
    Page<Task> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.deadline < :date AND t.status != 'COMPLETED'")
    List<Task> findOverdueTasks(@Param("date") LocalDate date);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.status = :status")
    Page<Task> findByAssignedToIdAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status, Pageable pageable);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = :status")
    Long countByStatus(@Param("status") Task.TaskStatus status);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId")
    Long countByAssignedToId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId AND t.status = :status")
    Long countByAssignedToIdAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    Page<Task> findByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") Task.TaskStatus status, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.name LIKE %:keyword% OR t.description LIKE %:keyword%")
    Page<Task> searchTasks(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.createdBy.id = :userId")
    Page<Task> findByCreatedById(@Param("userId") Long userId, Pageable pageable);
}

