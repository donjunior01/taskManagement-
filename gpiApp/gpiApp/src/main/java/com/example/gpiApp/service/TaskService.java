package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.Task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskService {
    TaskDTO createTask(TaskDTO taskDTO);
    
    TaskDTO updateTask(Long taskId, TaskDTO taskDTO);
    
    void deleteTask(Long taskId);
    
    Optional<TaskDTO> getTaskById(Long taskId);
    
    List<TaskDTO> getAllTasks();
    
    List<TaskDTO> getTasksByCreator(Long userId);
    
    List<TaskDTO> getTasksByProject(Long projectId);
    
    List<TaskDTO> getTasksByStatus(Task.TaskStatus status);
    
    List<TaskDTO> getTasksByType(Task.TaskType taskType);
    
    List<TaskDTO> getTasksByCreatorAndStatus(Long userId, Task.TaskStatus status);
    
    List<TaskDTO> getOverdueTasks();
    
    List<TaskDTO> getTasksByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    
    List<TaskDTO> getTasksByTeam(Long teamId);
    
    List<TaskDTO> getTasksByDifficulty(Task.DifficultyLevel difficulty);
    
    List<TaskDTO> searchTasksByKeyword(String keyword);
    
    long countTasksByStatus(Task.TaskStatus status);
    
    long countTasksByUserAndStatus(Long userId, Task.TaskStatus status);
    
    TaskDTO updateTaskStatus(Long taskId, Task.TaskStatus status);
    
    TaskDTO updateTaskProgress(Long taskId, Double progressPercentage);
    
    TaskDTO assignTask(Long taskId, Long assigneeId);
    
    TaskDTO completeTask(Long taskId);
} 