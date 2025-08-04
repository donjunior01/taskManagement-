package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskCategoryDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskCategoryService {
    TaskCategoryDTO createTaskCategory(TaskCategoryDTO taskCategoryDTO);
    TaskCategoryDTO updateTaskCategory(UUID categoryId, TaskCategoryDTO taskCategoryDTO);
    void deleteTaskCategory(UUID categoryId);
    Optional<TaskCategoryDTO> getTaskCategoryById(UUID categoryId);
    List<TaskCategoryDTO> getAllTaskCategories();
    List<TaskCategoryDTO> getActiveTaskCategories();
    boolean existsByCategoryName(String categoryName);
} 