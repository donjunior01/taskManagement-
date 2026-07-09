package com.example.gpiApp;

import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.UserNotificationPreferences;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.NotificationRepository;
import com.example.gpiApp.repository.UserNotificationPreferencesRepository;
import com.example.gpiApp.service.EmailService;
import com.example.gpiApp.service.NotificationDigestService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDigestServiceTest {

    @Mock UserNotificationPreferencesRepository prefsRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock EmailService emailService;
    @InjectMocks NotificationDigestService service;

    private UserNotificationPreferences prefFor(Long userId, String email, String firstName) {
        allUsers u = new allUsers();
        u.setId(userId); u.setEmail(email); u.setFirstName(firstName);
        UserNotificationPreferences p = new UserNotificationPreferences();
        p.setId(userId); p.setUser(u); p.setDailyDigest(true); p.setEmailNotifications(true);
        return p;
    }

    @Test
    void sendsDigestOnlyToUsersWithUnreadNotifications() {
        when(prefsRepository.findByDailyDigestTrueAndEmailNotificationsTrue())
                .thenReturn(List.of(prefFor(1L, "ana@example.com", "Ana")));
        Notification n = new Notification();
        n.setTitle("Task due"); n.setMessage("Ship it");
        when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));

        int sent = service.sendDailyDigests();

        assertEquals(1, sent);
        verify(emailService).sendDigest(eq("ana@example.com"), contains("1 unread notification"), contains("Ana"));
    }

    @Test
    void skipsUsersWithNoUnreadNotifications() {
        when(prefsRepository.findByDailyDigestTrueAndEmailNotificationsTrue())
                .thenReturn(List.of(prefFor(1L, "ana@example.com", "Ana")));
        when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        int sent = service.sendDailyDigests();

        assertEquals(0, sent);
        verifyNoInteractions(emailService);
    }

    @Test
    void skipsUsersWithoutAnEmailAddress() {
        when(prefsRepository.findByDailyDigestTrueAndEmailNotificationsTrue())
                .thenReturn(List.of(prefFor(1L, null, "NoEmail")));

        int sent = service.sendDailyDigests();

        assertEquals(0, sent);
        verifyNoInteractions(emailService);
        verifyNoInteractions(notificationRepository);
    }
}
