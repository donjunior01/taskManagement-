package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.assignedTo.userId = :userId")
    List<TaskAssignment> findByAssignedToUserId(@Param("userId") Long userId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.taskId = :taskId")
    List<TaskAssignment> findByTaskTaskId(@Param("taskId") Long taskId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.assignedBy.userId = :userId")
    List<TaskAssignment> findByAssignedByUserId(@Param("userId") Long userId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.assignedTo.userId = :userId AND ta.assignmentStatus = :status")
    List<TaskAssignment> findByAssignedToAndStatus(@Param("userId") Long userId, @Param("status") TaskAssignment.AssignmentStatus status);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.taskId = :taskId AND ta.assignmentStatus = 'ACCEPTED'")
    Optional<TaskAssignment> findAcceptedAssignmentByTask(@Param("taskId") Long taskId);

    @Query("SELECT COUNT(ta) FROM TaskAssignment ta WHERE ta.assignedTo.userId = :userId AND ta.assignmentStatus = 'PENDING'")
    long countPendingAssignmentsByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(ta) FROM TaskAssignment ta WHERE ta.assignedTo.userId = :userId AND ta.assignmentStatus = 'ACCEPTED'")
    long countAcceptedAssignmentsByUser(@Param("userId") Long userId);
} 