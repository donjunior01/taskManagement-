package com.example.gpiApp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneData {
    private String taskName;
    private String projectName;
    private String assigneeName;
    private String priority;
    private String status;
    private String deadline;
    private Integer progress;
}
