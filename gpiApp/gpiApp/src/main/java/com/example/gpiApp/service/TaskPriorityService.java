package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskPriorityDTO;

import java.util.List;
import java.util.Optional;

public interface TaskPriorityService {
    TaskPriorityDTO createTaskPriority(TaskPriorityDTO taskPriorityDTO);
    TaskPriorityDTO updateTaskPriority(Long priorityId, TaskPriorityDTO taskPriorityDTO);
    void deleteTaskPriority(Long priorityId);
    Optional<TaskPriorityDTO> getTaskPriorityById(Long priorityId);
    List<TaskPriorityDTO> getAllTaskPriorities();
    List<TaskPriorityDTO> getActiveTaskPriorities();
    boolean existsByPriorityName(String priorityName);
    Optional<TaskPriorityDTO> getPriorityByName(String priorityName);
    List<TaskPriorityDTO> getPrioritiesByLevel(Integer level);
} 