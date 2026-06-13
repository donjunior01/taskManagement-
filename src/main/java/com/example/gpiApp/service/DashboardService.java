package com.example.gpiApp.service;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    
    public DashboardStatsDTO getAdminDashboardStats(Long adminId) {
        long totalUsers = userRepository.count();
        // Project counts are scoped to the projects this admin created — every admin shares the
        // same dashboard layout but sees only their own project portfolio (traceability).
        long totalProjects;
        long activeProjects;
        long completedProjects;
        long onHoldProjects;
        if (adminId != null) {
            totalProjects = projectRepository.countByCreatedById(adminId);
            activeProjects = projectRepository.countByCreatedByIdAndStatus(adminId, Project.ProjectStatus.ACTIVE)
                    + projectRepository.countByCreatedByIdAndStatus(adminId, Project.ProjectStatus.IN_PROGRESS)
                    + projectRepository.countByCreatedByIdAndStatus(adminId, Project.ProjectStatus.PLANNED);
            completedProjects = projectRepository.countByCreatedByIdAndStatus(adminId, Project.ProjectStatus.COMPLETED);
            onHoldProjects = projectRepository.countByCreatedByIdAndStatus(adminId, Project.ProjectStatus.ON_HOLD);
        } else {
            totalProjects = projectRepository.count();
            activeProjects = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE)
                    + projectRepository.countByStatus(Project.ProjectStatus.IN_PROGRESS)
                    + projectRepository.countByStatus(Project.ProjectStatus.PLANNED);
            completedProjects = projectRepository.countByStatus(Project.ProjectStatus.COMPLETED);
            onHoldProjects = projectRepository.countByStatus(Project.ProjectStatus.ON_HOLD);
        }
        
        long totalTasks = taskRepository.count();
        long activeTasks = taskRepository.countByStatus(Task.TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(Task.TaskStatus.COMPLETED);
        long overdueTasks = taskRepository.countByStatus(Task.TaskStatus.OVERDUE);
        long todoTasks = taskRepository.countByStatus(Task.TaskStatus.TODO);
        
        long totalTeams = teamRepository.count();
        long newUsersThisMonth = userRepository.countUsersCreatedThisMonth();
        
        // Calculate completion rate based on completed vs total non-todo tasks
        long relevantTasks = activeTasks + completedTasks + overdueTasks;
        double taskCompletionRate = relevantTasks > 0 ? (double) completedTasks / relevantTasks * 100 : 0;
        taskCompletionRate = Math.round(taskCompletionRate * 100.0) / 100.0;
        
        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .activeUsers(totalUsers)
                .inactiveUsers(0L)
                .newUsersThisMonth(newUsersThisMonth)
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
        // Get projects managed by this PM
        List<Project> managedProjects = projectRepository.findByManagerId(managerId, Pageable.unpaged()).getContent();
        List<Long> projectIds = managedProjects.stream()
                .map(Project::getId)
                .toList();
        
        // Count tasks for projects managed by this PM
        long totalTasks = projectIds.isEmpty() ? 0 : taskRepository.countByProjectIds(projectIds);
        long activeTasks = projectIds.isEmpty() ? 0 : taskRepository.countByProjectIdsAndStatus(projectIds, Task.TaskStatus.IN_PROGRESS);
        long completedTasks = projectIds.isEmpty() ? 0 : taskRepository.countByProjectIdsAndStatus(projectIds, Task.TaskStatus.COMPLETED);
        long overdueTasks = projectIds.isEmpty() ? 0 : taskRepository.countByProjectIdsAndStatus(projectIds, Task.TaskStatus.OVERDUE);
        
        // Count team members (users with USER role)
        long teamMembers = userRepository.countByRole(allUsers.Role.USER);
        
        long relevantTasks = activeTasks + completedTasks + overdueTasks;
        double taskCompletionRate = relevantTasks > 0 ? (double) completedTasks / relevantTasks * 100 : 0;
        taskCompletionRate = Math.round(taskCompletionRate * 100.0) / 100.0;
        
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
        taskCompletionRate = Math.round(taskCompletionRate * 100.0) / 100.0;
        
        return DashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .activeTasks(allActiveTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .build();
    }
}

