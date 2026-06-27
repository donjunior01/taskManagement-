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
    
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardStatsDTO getAdminDashboardStats(Long adminId) {
        long totalUsers = userRepository.count();
        // The admin dashboard is a portfolio-oversight view, so the project charts/KPIs reflect ALL
        // projects (global). Per-admin "who created what" is surfaced on the Users page (project
        // count column) and the project list "Créé par" column. Counts are non-overlapping so the
        // "Projets par Statut" donut adds up to the total.
        long inProgressProjects = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE)
                + projectRepository.countByStatus(Project.ProjectStatus.IN_PROGRESS);
        long plannedProjects = projectRepository.countByStatus(Project.ProjectStatus.PLANNED);
        long completedProjects = projectRepository.countByStatus(Project.ProjectStatus.COMPLETED);
        long onHoldProjects = projectRepository.countByStatus(Project.ProjectStatus.ON_HOLD);
        long cancelledProjects = projectRepository.countByStatus(Project.ProjectStatus.CANCELLED);
        // "Active" (KPI) = in-progress + planned; total = sum of all status buckets.
        long activeProjects = inProgressProjects + plannedProjects;
        long totalProjects = inProgressProjects + plannedProjects + completedProjects + onHoldProjects + cancelledProjects;
        
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
                .inProgressProjects(inProgressProjects)
                .plannedProjects(plannedProjects)
                .completedProjects(completedProjects)
                .onHoldProjects(onHoldProjects)
                .cancelledProjects(cancelledProjects)
                .totalTasks(totalTasks)
                .activeTasks(activeTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .totalTeams(totalTeams)
                .build();
    }
    
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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
    
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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

