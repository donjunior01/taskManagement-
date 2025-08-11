package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.service.NotificationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public List<NotificationDTO> getNotificationsByUser(String username) {
        List<NotificationDTO> notifications = new ArrayList<>();
        
        NotificationDTO notif1 = new NotificationDTO();
        notif1.setId(1L);
        notif1.setTitle("Task Assigned");
        notif1.setMessage("You have been assigned a new task: Design Landing Page");
        notif1.setType("task");
        notif1.setRecipient(username);
        notif1.setRead(false);
        notif1.setCreatedAt(LocalDateTime.now().minusHours(2));
        notifications.add(notif1);
        
        NotificationDTO notif2 = new NotificationDTO();
        notif2.setId(2L);
        notif2.setTitle("Project Update");
        notif2.setMessage("Project 'Website Redesign' has been updated");
        notif2.setType("project");
        notif2.setRecipient(username);
        notif2.setRead(true);
        notif2.setCreatedAt(LocalDateTime.now().minusDays(1));
        notif2.setReadAt(LocalDateTime.now().minusHours(12));
        notifications.add(notif2);
        
        return notifications;
    }

    @Override
    public boolean deleteNotification(Long id, String username) {
        return true;
    }
}
