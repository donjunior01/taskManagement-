package com.example.gpiApp.dto;

import lombok.Data;
import java.util.Map;

@Data
public class DashboardStatsDTO {
    private Long totalTasks;
    private Long activeTasks;
    private Long completedTasks;
    private Long overdueTasks;
    private Long totalUsers;
    private Long totalProjects;
    private Map<String, Object> chartData;
}
