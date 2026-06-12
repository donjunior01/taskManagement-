package com.example.gpiApp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Live API performance metrics, captured by {@code MetricsFilter} on every request
 * and aggregated by {@code MetricsService}. All values are real measurements (latency,
 * throughput, error rate, per-minute load history, slowest endpoints, recent 5xx).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceDTO {

    private double avgResponseMs;     // mean latency across all recorded requests
    private long requestsPerMin;      // requests in the last full minute
    private double errorRate;         // % of 5xx responses
    private double uptimeHours;       // JVM uptime
    private double memoryUsedPct;     // heap used / max
    private int processors;           // available CPU cores
    private long totalRequests;       // requests since startup

    private List<LoadPoint> serverLoad;     // last 60 minutes
    private List<SlowEndpoint> slowest;     // top slowest endpoints
    private List<RecentError> recentErrors; // most recent 5xx responses

    private LocalDateTime generatedAt;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoadPoint {
        private String minute;   // "HH:mm"
        private double cpu;      // %
        private double memory;   // %
        private long requests;   // requests in that minute
        private double avgMs;    // avg latency in that minute
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SlowEndpoint {
        private String endpoint;
        private double avgMs;
        private long maxMs;
        private long count;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecentError {
        private int status;
        private String endpoint;
        private LocalDateTime at;
    }
}
