package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.Task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskService {
    TaskDTO createTask(TaskDTO taskDTO);
    
    TaskDTO updateTask(UUID taskId, TaskDTO taskDTO);
    
    void deleteTask(UUID taskId);
    
    Optional<TaskDTO> getTaskById(UUID taskId);
    
    List<TaskDTO> getAllTasks();
    
    List<TaskDTO> getTasksByCreator(UUID userId);
    
    List<TaskDTO> getTasksByProject(UUID projectId);
    
    List<TaskDTO> getTasksByStatus(Task.TaskStatus status);
    
    List<TaskDTO> getTasksByType(Task.TaskType taskType);
    
    List<TaskDTO> getTasksByCreatorAndStatus(UUID userId, Task.TaskStatus status);
    
    List<TaskDTO> getOverdueTasks();
    
    List<TaskDTO> getTasksByUserAndDateRange(UUID userId, LocalDate startDate, LocalDate endDate);
    
    List<TaskDTO> getTasksByTeam(UUID teamId);
    
    List<TaskDTO> getTasksByDifficulty(Task.DifficultyLevel difficulty);
    
    List<TaskDTO> searchTasksByKeyword(String keyword);
    
    long countTasksByStatus(Task.TaskStatus status);
    
    long countTasksByUserAndStatus(UUID userId, Task.TaskStatus status);
    
    TaskDTO updateTaskStatus(UUID taskId, Task.TaskStatus status);
    
    TaskDTO updateTaskProgress(UUID taskId, Double progressPercentage);
    
    TaskDTO assignTask(UUID taskId, UUID assigneeId);
    
    TaskDTO completeTask(UUID taskId);
} 