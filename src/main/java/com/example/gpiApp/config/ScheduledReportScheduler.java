package com.example.gpiApp.config;

import com.example.gpiApp.service.ScheduledReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fires due scheduled report exports once a day (default 06:00; override
 * {@code reports.schedule.cron}). Work lives in {@link ScheduledReportService#runDue()}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledReportScheduler {

    private final ScheduledReportService scheduledReportService;

    @Scheduled(cron = "${reports.schedule.cron:0 0 6 * * *}")
    public void run() {
        try {
            int sent = scheduledReportService.runDue();
            if (sent > 0) log.info("Scheduled reports: dispatched {} email(s).", sent);
        } catch (Exception e) {
            log.warn("Scheduled report run failed: {}", e.getMessage());
        }
    }
}
