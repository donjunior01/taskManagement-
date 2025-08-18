package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private Long totalUsers;
    private Long totalProjects;
    private Long totalTasks;
    private Long activeTasks;
    private Long completedTasks;
    private Long overdueTasks;
    private Double systemUptime;
    private Map<String, Long> taskStatusDistribution;
    private List<ProjectProgressDTO> projectProgress;
    private List<UserActivityDTO> userActivity;
    private List<RecentActivityDTO> recentActivity;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectProgressDTO {
        private String name;
        private Double progress;
        private String status;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserActivityDTO {
        private String date;
        private Long tasksCompleted;
        private Long newUsers;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDTO {
        private String type;
        private String description;
        private String timestamp;
        private String user;
    }
}


