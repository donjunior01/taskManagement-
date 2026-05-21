package com.example.gpiApp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamAllocationData {
    private String fullName;
    private String username;
    private String role;
    private String email;
    private Integer tasksAssigned;
    private Integer tasksCompleted;
    private Integer projectsCount;
}
