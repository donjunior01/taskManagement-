package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    // User statistics
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long newUsersThisMonth;
    
    // Project statistics
    private Long totalProjects;
    private Long activeProjects;
    private Long completedProjects;
    private Long onHoldProjects;
    
    // Task statistics
    private Long totalTasks;
    private Long activeTasks;
    private Long completedTasks;
    private Long overdueTasks;
    private Double taskCompletionRate;
    
    // Team statistics
    private Long totalTeams;
    private Long teamMembers;
}

