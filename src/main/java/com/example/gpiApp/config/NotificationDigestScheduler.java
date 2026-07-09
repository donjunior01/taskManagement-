package com.example.gpiApp.config;

import com.example.gpiApp.service.NotificationDigestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sends the daily notification digest once a day (default 08:00; override
 * {@code notifications.digest.cron}). Thin wrapper — the work lives in
 * {@link NotificationDigestService#sendDailyDigests()}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDigestScheduler {

    private final NotificationDigestService digestService;

    @Scheduled(cron = "${notifications.digest.cron:0 0 8 * * *}")
    public void run() {
        try {
            int sent = digestService.sendDailyDigests();
            if (sent > 0) log.info("Daily digest: sent {} email(s).", sent);
        } catch (Exception e) {
            log.warn("Daily digest run failed: {}", e.getMessage());
        }
    }
}
