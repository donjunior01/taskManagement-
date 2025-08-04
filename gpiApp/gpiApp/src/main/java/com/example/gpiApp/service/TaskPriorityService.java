package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskPriorityDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskPriorityService {
    TaskPriorityDTO createTaskPriority(TaskPriorityDTO taskPriorityDTO);
    TaskPriorityDTO updateTaskPriority(UUID priorityId, TaskPriorityDTO taskPriorityDTO);
    void deleteTaskPriority(UUID priorityId);
    Optional<TaskPriorityDTO> getTaskPriorityById(UUID priorityId);
    List<TaskPriorityDTO> getAllTaskPriorities();
    List<TaskPriorityDTO> getActiveTaskPriorities();
    boolean existsByPriorityName(String priorityName);
    Optional<TaskPriorityDTO> getPriorityByName(String priorityName);
    List<TaskPriorityDTO> getPrioritiesByLevel(Integer level);
} 