package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TaskPriorityDTO;
import com.example.gpiApp.entity.TaskPriority;
import com.example.gpiApp.repository.TaskPriorityRepository;
import com.example.gpiApp.service.TaskPriorityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskPriorityServiceImpl implements TaskPriorityService {
    
    private final TaskPriorityRepository taskPriorityRepository;
    
    @Override
    public TaskPriorityDTO createTaskPriority(TaskPriorityDTO taskPriorityDTO) {
        TaskPriority priority = TaskPriority.builder()
                .priorityName(taskPriorityDTO.getPriorityName())
                .priorityLevel(taskPriorityDTO.getPriorityLevel())
                .colorCode(taskPriorityDTO.getColorCode())
                .isActive(true)
                .build();
        
        TaskPriority savedPriority = taskPriorityRepository.save(priority);
        return convertToDTO(savedPriority);
    }
    
    @Override
    public TaskPriorityDTO updateTaskPriority(Long priorityId, TaskPriorityDTO taskPriorityDTO) {
        Optional<TaskPriority> priorityOpt = taskPriorityRepository.findById(priorityId);
        if (priorityOpt.isPresent()) {
            TaskPriority priority = priorityOpt.get();
            priority.setPriorityName(taskPriorityDTO.getPriorityName());
            priority.setPriorityLevel(taskPriorityDTO.getPriorityLevel());
            priority.setColorCode(taskPriorityDTO.getColorCode());
            priority.setIsActive(taskPriorityDTO.getIsActive());
            
            TaskPriority updatedPriority = taskPriorityRepository.save(priority);
            return convertToDTO(updatedPriority);
        }
        throw new RuntimeException("Task Priority not found");
    }
    
    @Override
    public void deleteTaskPriority(Long priorityId) {
        taskPriorityRepository.deleteById(priorityId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<TaskPriorityDTO> getTaskPriorityById(Long priorityId) {
        return taskPriorityRepository.findById(priorityId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskPriorityDTO> getAllTaskPriorities() {
        return taskPriorityRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskPriorityDTO> getActiveTaskPriorities() {
        return taskPriorityRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByPriorityName(String priorityName) {
        return taskPriorityRepository.existsByPriorityName(priorityName);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<TaskPriorityDTO> getPriorityByName(String priorityName) {
        return taskPriorityRepository.findByPriorityName(priorityName).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskPriorityDTO> getPrioritiesByLevel(Integer level) {
        return taskPriorityRepository.findByIsActiveTrueOrderByPriorityLevel().stream()
                .filter(priority -> priority.getPriorityLevel() >= level)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private TaskPriorityDTO convertToDTO(TaskPriority priority) {
        return TaskPriorityDTO.builder()
                .priorityId(priority.getPriorityId())
                .priorityName(priority.getPriorityName())
                .priorityLevel(priority.getPriorityLevel())
                .colorCode(priority.getColorCode())
                .isActive(priority.getIsActive())
                .build();
    }
} 