package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskPriorityRepository extends JpaRepository<TaskPriority, Long> {
    List<TaskPriority> findByIsActiveTrue();
    
    Optional<TaskPriority> findByPriorityName(String priorityName);
    
    boolean existsByPriorityName(String priorityName);
    
    List<TaskPriority> findByIsActiveTrueOrderByPriorityLevel();
} 