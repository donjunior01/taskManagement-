package com.example.gpiApp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectHealthData {
    private String projectName;
    private String status;
    private Integer progressPercent;
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer pendingTasks;
    private String startDate;
    private String endDate;
}
