package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory, UUID> {
    List<TaskCategory> findByIsActiveTrue();
    
    Optional<TaskCategory> findByCategoryName(String categoryName);
    
    boolean existsByCategoryName(String categoryName);
    
    List<TaskCategory> findByIsActiveTrueOrderByCategoryName();
} 