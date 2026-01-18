package com.example.gpiApp.service;

import com.example.gpiApp.dto.DashboardStatsDTO;
import com.example.gpiApp.entity.*;
import com.example.gpiApp.repository.*;
import com.example.gpiApp.service.impl.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final DeliverableRepository deliverableRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserSessionRepository userSessionRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final SecurityService securityService;
    
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
        
        // Security statistics
        long dailyLoginAttempts = loginAttemptRepository.countByStatusAndAttemptedAtAfter(
                LoginAttempt.LoginStatus.SUCCESS, LocalDateTime.now().minusDays(1));
        long failedLoginAttempts = loginAttemptRepository.countByStatusAndAttemptedAtAfter(
                LoginAttempt.LoginStatus.FAILED, LocalDateTime.now().minusDays(1));
        long activeSessionsCount = userSessionRepository.countByIsActiveTrue();
        long unresolvedAlertsCount = securityAlertRepository.countByIsResolvedFalse();
        
        // Deliverable statistics
        long totalDeliverables = deliverableRepository.count();
        long pendingDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.PENDING);
        long approvedDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.APPROVED);
        long rejectedDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.REJECTED);
        
        // System performance metrics (placeholder - can be integrated with actual system monitoring)
        double cpuUsage = getSystemCpuUsage();
        double memoryUsage = getSystemMemoryUsage();
        double diskUsage = getSystemDiskUsage();
        
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
                .dailyLoginAttempts(dailyLoginAttempts)
                .failedLoginAttempts(failedLoginAttempts)
                .activeSessionsCount(activeSessionsCount)
                .unresolvedAlertsCount(unresolvedAlertsCount)
                .totalDeliverables(totalDeliverables)
                .pendingDeliverables(pendingDeliverables)
                .approvedDeliverables(approvedDeliverables)
                .rejectedDeliverables(rejectedDeliverables)
                .cpuUsage(cpuUsage)
                .memoryUsage(memoryUsage)
                .diskUsage(diskUsage)
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
        
        // Deliverable statistics for PM
        long totalDeliverables = deliverableRepository.count();
        long pendingDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.PENDING);
        long approvedDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.APPROVED);
        
        return DashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .activeTasks(activeTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .teamMembers(teamMembers)
                .totalDeliverables(totalDeliverables)
                .pendingDeliverables(pendingDeliverables)
                .approvedDeliverables(approvedDeliverables)
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
        
        // User's deliverable statistics
        long totalDeliverables = deliverableRepository.count();
        long pendingDeliverables = deliverableRepository.countByStatus(Deliverable.DeliverableStatus.PENDING);
        
        return DashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .activeTasks(allActiveTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .totalDeliverables(totalDeliverables)
                .pendingDeliverables(pendingDeliverables)
                .build();
    }
    
    // Helper methods for system performance metrics
    private double getSystemCpuUsage() {
        return 25.5; // Placeholder - CPU metrics not consistently available across JVMs
    }
    
    private double getSystemMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        return Math.round((usedMemory * 100.0 / maxMemory) * 100.0) / 100.0;
    }
    
    private double getSystemDiskUsage() {
        try {
            java.io.File diskPartition = new java.io.File("/");
            long totalSpace = diskPartition.getTotalSpace();
            long usableSpace = diskPartition.getUsableSpace();
            long usedSpace = totalSpace - usableSpace;
            return Math.round((usedSpace * 100.0 / totalSpace) * 100.0) / 100.0;
        } catch (Exception e) {
            return 0.0;
        }
    }
}