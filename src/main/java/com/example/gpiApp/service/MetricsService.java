package com.example.gpiApp.service;

import com.example.gpiApp.dto.analytics.PerformanceDTO;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * In-memory aggregation of real HTTP request metrics. {@code MetricsFilter} calls
 * {@link #record} for every request; the admin performance page reads {@link #snapshot()}.
 * Holds lifetime counters, per-endpoint latency stats, a rolling 60-minute load history,
 * and a ring of the most recent 5xx errors.
 */
@Service
public class MetricsService {

    private static final int HISTORY_MINUTES = 60;
    private static final int MAX_RECENT_ERRORS = 12;
    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final AtomicLong totalRequests = new AtomicLong();
    private final AtomicLong totalErrors = new AtomicLong();
    private final AtomicLong totalLatency = new AtomicLong();

    private final Map<String, EndpointStat> endpoints = new ConcurrentHashMap<>();
    private final Map<Long, MinuteBucket> minutes = new ConcurrentHashMap<>(); // epoch-minute -> bucket
    private final Deque<PerformanceDTO.RecentError> recentErrors = new ArrayDeque<>();

    public void record(String method, String path, int status, long durationMs) {
        String endpoint = method + " " + normalize(path);
        totalRequests.incrementAndGet();
        totalLatency.addAndGet(durationMs);
        boolean isError = status >= 500;
        if (isError) totalErrors.incrementAndGet();

        endpoints.computeIfAbsent(endpoint, k -> new EndpointStat()).add(durationMs);

        long epochMinute = Instant.now().getEpochSecond() / 60;
        MinuteBucket bucket = minutes.computeIfAbsent(epochMinute, k -> new MinuteBucket());
        bucket.requests.increment();
        bucket.latency.add(durationMs);
        if (isError) bucket.errors.increment();
        sampleSystem(bucket);
        pruneMinutes(epochMinute);

        if (isError) {
            synchronized (recentErrors) {
                recentErrors.addFirst(PerformanceDTO.RecentError.builder()
                        .status(status).endpoint(endpoint).at(LocalDateTime.now()).build());
                while (recentErrors.size() > MAX_RECENT_ERRORS) recentErrors.removeLast();
            }
        }
    }

    public PerformanceDTO snapshot() {
        long reqs = totalRequests.get();
        double avgMs = reqs > 0 ? round1((double) totalLatency.get() / reqs) : 0;
        double errorRate = reqs > 0 ? round2((double) totalErrors.get() / reqs * 100) : 0;

        long nowMinute = Instant.now().getEpochSecond() / 60;
        double curMem = memoryUsedPct();
        double curCpu = cpuLoadPct();

        // Rolling 60-minute load history (oldest → newest). Empty minutes carry the
        // current system sample so the line stays continuous.
        List<PerformanceDTO.LoadPoint> load = new ArrayList<>();
        for (int back = HISTORY_MINUTES - 1; back >= 0; back--) {
            long m = nowMinute - back;
            MinuteBucket b = minutes.get(m);
            LocalDateTime t = LocalDateTime.ofInstant(Instant.ofEpochSecond(m * 60), ZoneId.systemDefault());
            long count = b != null ? b.requests.sum() : 0;
            double minuteAvg = (b != null && count > 0) ? round1((double) b.latency.sum() / count) : 0;
            load.add(PerformanceDTO.LoadPoint.builder()
                    .minute(t.format(HHMM))
                    .cpu(b != null && b.cpu > 0 ? round1(b.cpu) : round1(curCpu))
                    .memory(b != null && b.memory > 0 ? round1(b.memory) : round1(curMem))
                    .requests(count)
                    .avgMs(minuteAvg)
                    .build());
        }
        long requestsLastMin = minutes.containsKey(nowMinute) ? minutes.get(nowMinute).requests.sum() : 0;

        List<PerformanceDTO.SlowEndpoint> slowest = endpoints.entrySet().stream()
                .map(e -> PerformanceDTO.SlowEndpoint.builder()
                        .endpoint(e.getKey())
                        .avgMs(round1(e.getValue().avg()))
                        .maxMs(e.getValue().max.get())
                        .count(e.getValue().count.sum())
                        .build())
                .sorted(Comparator.comparingDouble(PerformanceDTO.SlowEndpoint::getAvgMs).reversed())
                .limit(6)
                .collect(java.util.stream.Collectors.toList());

        List<PerformanceDTO.RecentError> errs;
        synchronized (recentErrors) { errs = new ArrayList<>(recentErrors); }

        return PerformanceDTO.builder()
                .avgResponseMs(avgMs)
                .requestsPerMin(requestsLastMin)
                .errorRate(errorRate)
                .uptimeHours(round1(ManagementFactory.getRuntimeMXBean().getUptime() / 3_600_000.0))
                .memoryUsedPct(round1(curMem))
                .processors(Runtime.getRuntime().availableProcessors())
                .totalRequests(reqs)
                .serverLoad(load)
                .slowest(slowest)
                .recentErrors(errs)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // ── helpers ──
    private void sampleSystem(MinuteBucket bucket) {
        bucket.memory = memoryUsedPct();
        double cpu = cpuLoadPct();
        if (cpu > 0) bucket.cpu = cpu;
    }

    private double memoryUsedPct() {
        Runtime rt = Runtime.getRuntime();
        long used = rt.totalMemory() - rt.freeMemory();
        long max = rt.maxMemory();
        return max > 0 ? (double) used / max * 100 : 0;
    }

    private double cpuLoadPct() {
        try {
            java.lang.management.OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();
            if (os instanceof com.sun.management.OperatingSystemMXBean sun) {
                double load = sun.getProcessCpuLoad(); // 0..1, -1 if unavailable
                if (load >= 0) return load * 100;
            }
            double sysLoad = os.getSystemLoadAverage(); // -1 on Windows
            if (sysLoad >= 0) return Math.min(100, sysLoad / os.getAvailableProcessors() * 100);
        } catch (Exception ignored) { }
        return 0;
    }

    /** Collapse numeric path segments to {id} so /api/projects/42 groups with /api/projects/{id}. */
    private String normalize(String path) {
        if (path == null) return "/";
        String[] parts = path.split("/");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p.isEmpty()) continue;
            sb.append('/').append(p.matches("\\d+") ? "{id}" : p);
        }
        return sb.length() == 0 ? "/" : sb.toString();
    }

    private void pruneMinutes(long nowMinute) {
        long cutoff = nowMinute - HISTORY_MINUTES;
        minutes.keySet().removeIf(m -> m < cutoff);
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    private static class EndpointStat {
        final LongAdder count = new LongAdder();
        final LongAdder latency = new LongAdder();
        final AtomicLong max = new AtomicLong();
        void add(long ms) {
            count.increment();
            latency.add(ms);
            max.updateAndGet(prev -> Math.max(prev, ms));
        }
        double avg() { long c = count.sum(); return c > 0 ? (double) latency.sum() / c : 0; }
    }

    private static class MinuteBucket {
        final LongAdder requests = new LongAdder();
        final LongAdder errors = new LongAdder();
        final LongAdder latency = new LongAdder();
        volatile double cpu;
        volatile double memory;
    }
}
