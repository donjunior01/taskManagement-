package com.example.gpiApp.service;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    
    public DashboardStatsDTO getAdminDashboardStats() {
        long totalUsers = userRepository.count();
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE);
        long completedProjects = projectRepository.countByStatus(Project.ProjectStatus.COMPLETED);
        long onHoldProjects = projectRepository.countByStatus(Project.ProjectStatus.ON_HOLD);
        
        long totalTasks = taskRepository.count();
        long activeTasks = taskRepository.countByStatus(Task.TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(Task.TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countByStatus(Task.TaskStatus.OVERDUE);
        long todoTasks = taskRepository.countByStatus(Task.TaskStatus.TODO);
        
        long totalTeams = teamRepository.count();
        
        // Calculate completion rate based on completed vs total non-todo tasks
        long relevantTasks = activeTasks + completedTasks + overdueTasks;
        double taskCompletionRate = relevantTasks > 0 ? (double) completedTasks / relevantTasks * 100 : 0;
        
        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .activeUsers(totalUsers)
                .inactiveUsers(0L)
                .newUsersThisMonth(0L)
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .onHoldProjects(onHoldProjects)
                .totalTasks(totalTasks)
                .activeTasks(activeTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .totalTeams(totalTeams)
                .build();
    }
    
    public DashboardStatsDTO getManagerDashboardStats(Long managerId) {
        // Count tasks for projects managed by this PM
        long totalTasks = taskRepository.count();
        long activeTasks = taskRepository.countByStatus(Task.TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(Task.TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countByStatus(Task.TaskStatus.OVERDUE);
        
        // Count team members (users with USER role)
        long teamMembers = userRepository.countByRole(allUsers.Role.USER);
        
        long relevantTasks = activeTasks + completedTasks + overdueTasks;
        double taskCompletionRate = relevantTasks > 0 ? (double) completedTasks / relevantTasks * 100 : 0;
        
        return DashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .activeTasks(activeTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .teamMembers(teamMembers)
                .build();
    }
    
    public DashboardStatsDTO getUserDashboardStats(Long userId) {
        long totalTasks = taskRepository.countByAssignedToId(userId);
        long activeTasks = taskRepository.countByAssignedToIdAndStatus(userId, Task.TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByAssignedToIdAndStatus(userId, Task.TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countByAssignedToIdAndStatus(userId, Task.TaskStatus.OVERDUE);
        long todoTasks = taskRepository.countByAssignedToIdAndStatus(userId, Task.TaskStatus.TODO);
        
        // For user stats, include todo tasks as "active"
        long allActiveTasks = activeTasks + todoTasks;
        
        long relevantTasks = allActiveTasks + completedTasks + overdueTasks;
        double taskCompletionRate = relevantTasks > 0 ? (double) completedTasks / relevantTasks * 100 : 0;
        
        return DashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .activeTasks(allActiveTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .build();
    }
}

