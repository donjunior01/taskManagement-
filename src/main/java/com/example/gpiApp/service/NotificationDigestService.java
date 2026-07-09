package com.example.gpiApp.service;

import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.UserNotificationPreferences;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.NotificationRepository;
import com.example.gpiApp.repository.UserNotificationPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds and sends the daily notification digest — a single email per opted-in user summarising their
 * unread notifications. System-wide (all orgs): there is no TenantContext on the scheduler thread, so
 * the tenant filter is inactive and queries run by explicit user id. Users with no unread items are
 * skipped, and email that is disabled/unconfigured is a graceful no-op (see EmailService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDigestService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("MMM dd, HH:mm");

    private final UserNotificationPreferencesRepository prefsRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Value("${notifications.digest.max-items:15}")
    private int maxItems;

    /** @return number of digest emails dispatched. */
    @Transactional(readOnly = true)
    public int sendDailyDigests() {
        int sent = 0;
        for (UserNotificationPreferences pref : prefsRepository.findByDailyDigestTrueAndEmailNotificationsTrue()) {
            try {
                allUsers user = pref.getUser();
                if (user == null || user.getEmail() == null || user.getEmail().isBlank()) continue;
                List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
                if (unread.isEmpty()) continue;
                emailService.sendDigest(user.getEmail(), subject(unread.size()), body(user, unread));
                sent++;
            } catch (Exception e) {
                log.warn("Digest for preferences {} failed: {}", pref.getId(), e.getMessage());
            }
        }
        return sent;
    }

    private String subject(int n) {
        return "TaskMaster Pro — " + n + " unread notification" + (n == 1 ? "" : "s");
    }

    private String body(allUsers user, List<Notification> unread) {
        StringBuilder sb = new StringBuilder();
        String name = (user.getFirstName() != null && !user.getFirstName().isBlank()) ? user.getFirstName() : "there";
        sb.append("Hi ").append(name).append(",\n\n")
          .append("You have ").append(unread.size()).append(" unread notification")
          .append(unread.size() == 1 ? "" : "s").append(":\n\n");
        int shown = Math.min(unread.size(), Math.max(1, maxItems));
        for (int i = 0; i < shown; i++) {
            Notification n = unread.get(i);
            sb.append("• ").append(n.getTitle() != null ? n.getTitle() : "Notification");
            if (n.getMessage() != null && !n.getMessage().isBlank()) sb.append(" — ").append(n.getMessage());
            if (n.getCreatedAt() != null) sb.append(" (").append(n.getCreatedAt().format(WHEN)).append(")");
            sb.append("\n");
        }
        if (unread.size() > shown) sb.append("\n…and ").append(unread.size() - shown).append(" more.\n");
        sb.append("\nOpen TaskMaster Pro to review them.\n\n")
          .append("You're receiving this because you enabled the daily digest in your notification settings.");
        return sb.toString();
    }
}
