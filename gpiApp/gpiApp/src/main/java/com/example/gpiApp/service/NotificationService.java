package com.example.gpiApp.service;

import com.example.gpiApp.dto.NotificationDTO;
import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getNotificationsByUser(String username);
    boolean deleteNotification(Long id, String username);
}
