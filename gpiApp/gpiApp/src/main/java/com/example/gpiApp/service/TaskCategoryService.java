package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskCategoryDTO;

import java.util.List;
import java.util.Optional;

public interface TaskCategoryService {
    TaskCategoryDTO createTaskCategory(TaskCategoryDTO taskCategoryDTO);
    TaskCategoryDTO updateTaskCategory(Long categoryId, TaskCategoryDTO taskCategoryDTO);
    void deleteTaskCategory(Long categoryId);
    Optional<TaskCategoryDTO> getTaskCategoryById(Long categoryId);
    List<TaskCategoryDTO> getAllTaskCategories();
    List<TaskCategoryDTO> getActiveTaskCategories();
    boolean existsByCategoryName(String categoryName);
} 