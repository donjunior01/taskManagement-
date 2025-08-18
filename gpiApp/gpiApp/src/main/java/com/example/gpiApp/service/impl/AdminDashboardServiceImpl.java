package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.AdminDashboardStatsDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Override
    public AdminDashboardStatsDTO getDashboardStats() {
        // Get basic counts
        Long totalUsers = userRepository.count();
        Long totalProjects = projectRepository.count();
        Long totalTasks = taskRepository.count();
        
        // Get task status counts
        Long activeTasks = taskRepository.countTasksByStatus(Task.TaskStatus.IN_PROGRESS);
        Long completedTasks = taskRepository.countTasksByStatus(Task.TaskStatus.COMPLETED);
        Long overdueTasks = (long) taskRepository.findOverdueTasks(LocalDate.now()).size();
        
        // Calculate system uptime (simplified - you might want to implement actual uptime tracking)
        Double systemUptime = 99.5; // Placeholder - implement actual uptime calculation
        
        // Get task status distribution
        Map<String, Long> taskStatusDistribution = getTaskStatusDistribution();
        
        // Get project progress
        List<AdminDashboardStatsDTO.ProjectProgressDTO> projectProgress = getProjectProgress();
        
        // Get user activity
        List<AdminDashboardStatsDTO.UserActivityDTO> userActivity = getUserActivity();
        
        // Get recent activity
        List<AdminDashboardStatsDTO.RecentActivityDTO> recentActivity = getRecentActivity();
        
        return AdminDashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .activeTasks(activeTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .systemUptime(systemUptime)
                .taskStatusDistribution(taskStatusDistribution)
                .projectProgress(projectProgress)
                .userActivity(userActivity)
                .recentActivity(recentActivity)
                .build();
    }
    
    private Map<String, Long> getTaskStatusDistribution() {
        Map<String, Long> distribution = new HashMap<>();
        
        // Count tasks by status
        Arrays.stream(Task.TaskStatus.values()).forEach(status -> {
            long count = taskRepository.countTasksByStatus(status);
            distribution.put(status.name(), count);
        });
        
        return distribution;
    }
    
    private List<AdminDashboardStatsDTO.ProjectProgressDTO> getProjectProgress() {
        List<Project> projects = projectRepository.findAll();
        
        return projects.stream()
                .map(project -> {
                    // Calculate project progress based on completed tasks
                    List<Task> projectTasks = taskRepository.findByProjectProjectId(project.getProjectId());
                    double progress = 0.0;
                    
                    if (!projectTasks.isEmpty()) {
                        long completedTasks = projectTasks.stream()
                                .filter(task -> task.getStatus() == Task.TaskStatus.COMPLETED)
                                .count();
                        progress = (double) completedTasks / projectTasks.size() * 100;
                    }
                    
                    return AdminDashboardStatsDTO.ProjectProgressDTO.builder()
                            .name(project.getProjectName())
                            .progress(Math.round(progress * 100.0) / 100.0) // Round to 2 decimal places
                            .status(project.getStatus().name())
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    private List<AdminDashboardStatsDTO.UserActivityDTO> getUserActivity() {
        List<AdminDashboardStatsDTO.UserActivityDTO> activity = new ArrayList<>();
        
        // Get activity for last 7 days
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            
            // Count tasks completed on this date
            long tasksCompleted = taskRepository.findAll().stream()
                    .filter(task -> task.getCompletedAt() != null && 
                            task.getCompletedAt().toLocalDate().equals(date))
                    .count();
            
            // Count new users created on this date
            long newUsers = userRepository.findAll().stream()
                    .filter(user -> user.getCreatedAt() != null && 
                            user.getCreatedAt().toLocalDate().equals(date))
                    .count();
            
            activity.add(AdminDashboardStatsDTO.UserActivityDTO.builder()
                    .date(date.format(DateTimeFormatter.ofPattern("MMM dd")))
                    .tasksCompleted(tasksCompleted)
                    .newUsers(newUsers)
                    .build());
        }
        
        return activity;
    }
    
    private List<AdminDashboardStatsDTO.RecentActivityDTO> getRecentActivity() {
        List<AdminDashboardStatsDTO.RecentActivityDTO> activity = new ArrayList<>();
        
        // Get recent tasks
        List<Task> recentTasks = taskRepository.findAll().stream()
                .sorted(Comparator.comparing(Task::getCreatedAt).reversed())
                .limit(5)
                .collect(Collectors.toList());
        
        for (Task task : recentTasks) {
            activity.add(AdminDashboardStatsDTO.RecentActivityDTO.builder()
                    .type("TASK_CREATED")
                    .description("Task '" + task.getTitle() + "' was created")
                    .timestamp(task.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")))
                    .user(task.getCreatedBy().getFirstName() + " " + task.getCreatedBy().getLastName())
                    .build());
        }
        
        // Get recent projects
        List<Project> recentProjects = projectRepository.findAll().stream()
                .sorted(Comparator.comparing(Project::getCreatedAt).reversed())
                .limit(3)
                .collect(Collectors.toList());
        
        for (Project project : recentProjects) {
            activity.add(AdminDashboardStatsDTO.RecentActivityDTO.builder()
                    .type("PROJECT_CREATED")
                    .description("Project '" + project.getProjectName() + "' was created")
                    .timestamp(project.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")))
                    .user("System")
                    .build());
        }
        
        // Sort by timestamp and return top 10
        return activity.stream()
                .sorted(Comparator.comparing(AdminDashboardStatsDTO.RecentActivityDTO::getTimestamp).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }
}


