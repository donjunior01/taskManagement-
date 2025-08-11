package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.service.TaskService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TaskServiceImpl implements TaskService {

    @Override
    public List<TaskDTO> getAllTasks() {
        // Mock data for now
        List<TaskDTO> tasks = new ArrayList<>();
        
        TaskDTO task1 = new TaskDTO();
        task1.setId(1L);
        task1.setTitle("Design Landing Page");
        task1.setDescription("Create a modern landing page for the new product");
        task1.setStatus("IN_PROGRESS");
        task1.setPriority("HIGH");
        task1.setAssignee("john.doe");
        task1.setCreatedBy("admin");
        task1.setDeadline(LocalDateTime.now().plusDays(7));
        task1.setCreatedAt(LocalDateTime.now().minusDays(5));
        task1.setUpdatedAt(LocalDateTime.now());
        task1.setProjectId(1L);
        task1.setProjectName("Website Redesign");
        task1.setProgress(60);
        task1.setDifficulty("MEDIUM");
        tasks.add(task1);
        
        TaskDTO task2 = new TaskDTO();
        task2.setId(2L);
        task2.setTitle("Database Optimization");
        task2.setDescription("Optimize database queries for better performance");
        task2.setStatus("COMPLETED");
        task2.setPriority("CRITICAL");
        task2.setAssignee("jane.smith");
        task2.setCreatedBy("admin");
        task2.setDeadline(LocalDateTime.now().minusDays(2));
        task2.setCreatedAt(LocalDateTime.now().minusDays(10));
        task2.setUpdatedAt(LocalDateTime.now().minusDays(2));
        task2.setProjectId(2L);
        task2.setProjectName("System Optimization");
        task2.setProgress(100);
        task2.setDifficulty("HARD");
        tasks.add(task2);
        
        return tasks;
    }

    @Override
    public List<TaskDTO> getTasksByManager(String managerUsername) {
        // For now, return all tasks
        return getAllTasks();
    }

    @Override
    public List<TaskDTO> getTasksByUser(String username) {
        // Filter tasks by assignee
        return getAllTasks().stream()
                .filter(task -> username.equals(task.getAssignee()))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    @Override
    public TaskDTO getTaskById(Long id) {
        return getAllTasks().stream()
                .filter(task -> id.equals(task.getId()))
                .findFirst()
                .orElse(null);
    }

    @Override
    public TaskDTO createTask(TaskDTO taskDTO) {
        // Mock implementation
        taskDTO.setId(System.currentTimeMillis());
        taskDTO.setCreatedAt(LocalDateTime.now());
        taskDTO.setUpdatedAt(LocalDateTime.now());
        return taskDTO;
    }

    @Override
    public TaskDTO updateTask(TaskDTO taskDTO) {
        // Mock implementation
        taskDTO.setUpdatedAt(LocalDateTime.now());
        return taskDTO;
    }

    @Override
    public boolean deleteTask(Long id) {
        // Mock implementation
        return true;
    }

    @Override
    public Long getTotalTasksCount() {
        return 156L;
    }

    @Override
    public Long getActiveTasksCount() {
        return 89L;
    }

    @Override
    public Long getCompletedTasksCount() {
        return 45L;
    }

    @Override
    public Long getOverdueTasksCount() {
        return 22L;
    }

    @Override
    public Long getTasksCountByManager(String managerUsername) {
        return 45L;
    }

    @Override
    public Long getActiveTasksCountByManager(String managerUsername) {
        return 23L;
    }

    @Override
    public Long getCompletedTasksCountByManager(String managerUsername) {
        return 15L;
    }

    @Override
    public Long getOverdueTasksCountByManager(String managerUsername) {
        return 7L;
    }

    @Override
    public Long getTasksCountByUser(String username) {
        return 12L;
    }

    @Override
    public Long getActiveTasksCountByUser(String username) {
        return 8L;
    }

    @Override
    public Long getCompletedTasksCountByUser(String username) {
        return 3L;
    }

    @Override
    public Long getOverdueTasksCountByUser(String username) {
        return 1L;
    }

    @Override
    public Map<String, Object> getTaskStatusDistribution() {
        Map<String, Object> distribution = new HashMap<>();
        distribution.put("IN_PROGRESS", 45);
        distribution.put("COMPLETED", 30);
        distribution.put("PENDING", 15);
        distribution.put("OVERDUE", 10);
        return distribution;
    }

    @Override
    public Map<String, Object> getTeamPerformanceData(String managerUsername) {
        Map<String, Object> performance = new HashMap<>();
        performance.put("averageCompletionTime", 5.2);
        performance.put("onTimeCompletion", 85.5);
        performance.put("teamEfficiency", 78.3);
        return performance;
    }

    @Override
    public Map<String, Object> getTaskProgressByUser(String username) {
        Map<String, Object> progress = new HashMap<>();
        progress.put("completed", 8);
        progress.put("inProgress", 3);
        progress.put("pending", 1);
        return progress;
    }

    @Override
    public Map<String, Object> getSystemReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalTasks", 156);
        reports.put("completedTasks", 45);
        reports.put("overdueTasks", 22);
        reports.put("averageCompletionTime", 4.8);
        return reports;
    }

    @Override
    public Map<String, Object> getTeamReports(String managerUsername) {
        Map<String, Object> reports = new HashMap<>();
        reports.put("teamTasks", 45);
        reports.put("teamCompleted", 15);
        reports.put("teamOverdue", 7);
        reports.put("teamEfficiency", 78.3);
        return reports;
    }

    @Override
    public Map<String, Object> getPersonalReports(String username) {
        Map<String, Object> reports = new HashMap<>();
        reports.put("personalTasks", 12);
        reports.put("personalCompleted", 3);
        reports.put("personalOverdue", 1);
        reports.put("personalEfficiency", 82.5);
        return reports;
    }
} 