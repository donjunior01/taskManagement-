package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanInfoDTO {
    private String organizationName;
    private String plan;
    private int maxUsers;       // -1 = unlimited
    private int maxProjects;    // -1 = unlimited
    private long userCount;
    private long projectCount;
    private List<PlanOption> available;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanOption {
        private String key;
        private int maxUsers;
        private int maxProjects;
    }
}
