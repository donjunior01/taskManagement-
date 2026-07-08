package com.example.gpiApp.config;

import com.example.gpiApp.service.AutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Drives the time-based automation triggers ("deadline approaching" / "overdue"). Runs once a day by
 * default; override {@code automation.timerules.cron} to change the cadence. Kept thin: all the work
 * (org iteration, tenant scoping, firing) lives in {@link AutomationService#runTimeBasedRules()}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutomationScheduler {

    private final AutomationService automationService;

    @Scheduled(cron = "${automation.timerules.cron:0 0 7 * * *}")
    public void runTimeBasedRules() {
        try {
            int fired = automationService.runTimeBasedRules();
            if (fired > 0) log.info("Time-based automation: fired {} rule event(s).", fired);
        } catch (Exception e) {
            log.warn("Time-based automation run failed: {}", e.getMessage());
        }
    }
}
