package com.example.gpiApp.service;

import com.example.gpiApp.dto.TaskDTO;
import java.util.List;
import java.util.Map;

public interface TaskService {
    List<TaskDTO> getAllTasks();
    List<TaskDTO> getTasksByManager(String managerUsername);
    List<TaskDTO> getTasksByUser(String username);
    TaskDTO getTaskById(Long id);
    TaskDTO createTask(TaskDTO taskDTO);
    TaskDTO updateTask(TaskDTO taskDTO);
    boolean deleteTask(Long id);
    
    // Dashboard statistics
    Long getTotalTasksCount();
    Long getActiveTasksCount();
    Long getCompletedTasksCount();
    Long getOverdueTasksCount();
    Long getTasksCountByManager(String managerUsername);
    Long getActiveTasksCountByManager(String managerUsername);
    Long getCompletedTasksCountByManager(String managerUsername);
    Long getOverdueTasksCountByManager(String managerUsername);
    Long getTasksCountByUser(String username);
    Long getActiveTasksCountByUser(String username);
    Long getCompletedTasksCountByUser(String username);
    Long getOverdueTasksCountByUser(String username);
    
    // Chart data
    Map<String, Object> getTaskStatusDistribution();
    Map<String, Object> getTeamPerformanceData(String managerUsername);
    Map<String, Object> getTaskProgressByUser(String username);
    
    // Reports
    Map<String, Object> getSystemReports();
    Map<String, Object> getTeamReports(String managerUsername);
    Map<String, Object> getPersonalReports(String username);
} 