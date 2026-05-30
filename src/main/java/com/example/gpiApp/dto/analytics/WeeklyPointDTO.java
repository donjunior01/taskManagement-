package com.example.gpiApp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One week's worth of created vs completed task counts, used for velocity and trend charts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyPointDTO {
    private String label;     // e.g. "May 12"
    private long created;     // tasks created that week
    private long completed;   // tasks completed that week
}
