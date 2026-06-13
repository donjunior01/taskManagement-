package com.example.gpiApp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Portfolio-wide analytics for the admin "Rapports" page. Every series is derived
 * in-memory from real persisted data (projects, tasks, support tickets, time logs,
 * login attempts, teams), so the charts/tables read live data with no mock values.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportsDTO {

    // ── Executive KPIs ──
    private double completionRate;        // % of tasks completed
    private double onTimeRate;            // % of completed-with-deadline tasks finished on time
    private double totalHours;            // sum of logged hours
    private double supportSatisfaction;   // 0..5, derived from resolution ratio
    private double resolvedRate;          // % of tickets resolved/closed
    private double avgResolutionHours;    // mean (resolvedAt - createdAt) for resolved tickets

    // ── Series ──
    private List<MonthStatusDTO> statusOverTime;     // 12 months
    private List<BurndownPointDTO> burndown;         // 14 days
    private List<DauPointDTO> dau;                    // 30 days
    private List<MonthRateDTO> resolutionTrend;       // 12 months
    private List<PerformerDTO> topPerformers;         // top 6
    private List<TeamLoadDTO> teamLoad;               // per team
    private List<CategoryCountDTO> ticketsByCategory; // by priority
    private List<RecapRowDTO> recap;                  // per-project summary

    private String period;                            // echo of the applied period filter
    private LocalDateTime generatedAt;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonthStatusDTO {
        private String mois;
        private long encours;
        private long termine;
        private long retard;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BurndownPointDTO {
        private String jour;
        private long ideal;
        private long reel;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DauPointDTO {
        private int jour;
        private long dau;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonthRateDTO {
        private String mois;
        private double taux;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PerformerDTO {
        private String nom;
        private long taches;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TeamLoadDTO {
        private String equipe;
        private long charge;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoryCountDTO {
        private String name;
        private long value;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecapRowDTO {
        private String nom;
        private String pm;
        private long taches;
        private long terminees;
        private long retard;
        private double heures;
        private int progression;
        private String statut;
    }
}
