package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** The ordered list of KPI widget keys a user has chosen for their dashboard. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardLayoutDTO {
    private List<String> widgets;
}
