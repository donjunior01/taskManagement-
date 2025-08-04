package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskPriorityRepository extends JpaRepository<TaskPriority, UUID> {
    List<TaskPriority> findByIsActiveTrue();
    
    Optional<TaskPriority> findByPriorityName(String priorityName);
    
    boolean existsByPriorityName(String priorityName);
    
    List<TaskPriority> findByIsActiveTrueOrderByPriorityLevel();
} 