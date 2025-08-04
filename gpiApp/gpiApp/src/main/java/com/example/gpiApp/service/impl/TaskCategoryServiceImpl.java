package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TaskCategoryDTO;
import com.example.gpiApp.entity.TaskCategory;
import com.example.gpiApp.repository.TaskCategoryRepository;
import com.example.gpiApp.service.TaskCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskCategoryServiceImpl implements TaskCategoryService {
    
    private final TaskCategoryRepository taskCategoryRepository;
    
    @Override
    public TaskCategoryDTO createTaskCategory(TaskCategoryDTO taskCategoryDTO) {
        TaskCategory category = TaskCategory.builder()
                .categoryName(taskCategoryDTO.getCategoryName())
                .description(taskCategoryDTO.getDescription())
                .colorCode(taskCategoryDTO.getColorCode())
                .isActive(true)
                .build();
        
        TaskCategory savedCategory = taskCategoryRepository.save(category);
        return convertToDTO(savedCategory);
    }
    
    @Override
    public TaskCategoryDTO updateTaskCategory(UUID categoryId, TaskCategoryDTO taskCategoryDTO) {
        Optional<TaskCategory> categoryOpt = taskCategoryRepository.findById(categoryId);
        if (categoryOpt.isPresent()) {
            TaskCategory category = categoryOpt.get();
            category.setCategoryName(taskCategoryDTO.getCategoryName());
            category.setDescription(taskCategoryDTO.getDescription());
            category.setColorCode(taskCategoryDTO.getColorCode());
            category.setIsActive(taskCategoryDTO.getIsActive());
            
            TaskCategory updatedCategory = taskCategoryRepository.save(category);
            return convertToDTO(updatedCategory);
        }
        throw new RuntimeException("Task Category not found");
    }
    
    @Override
    public void deleteTaskCategory(UUID categoryId) {
        taskCategoryRepository.deleteById(categoryId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<TaskCategoryDTO> getTaskCategoryById(UUID categoryId) {
        return taskCategoryRepository.findById(categoryId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskCategoryDTO> getAllTaskCategories() {
        return taskCategoryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskCategoryDTO> getActiveTaskCategories() {
        return taskCategoryRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByCategoryName(String categoryName) {
        return taskCategoryRepository.existsByCategoryName(categoryName);
    }
    
    @Transactional(readOnly = true)
    public Optional<TaskCategoryDTO> getCategoryByName(String categoryName) {
        return taskCategoryRepository.findByCategoryName(categoryName).map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public List<TaskCategoryDTO> getCategoriesByColor(String colorCode) {
        return taskCategoryRepository.findByIsActiveTrueOrderByCategoryName().stream()
                .filter(category -> colorCode.equals(category.getColorCode()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private TaskCategoryDTO convertToDTO(TaskCategory category) {
        return TaskCategoryDTO.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .colorCode(category.getColorCode())
                .isActive(category.getIsActive())
                .build();
    }
} 