package com.example.gpiApp.service;

import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendNotification(Long userId, String title, String message, String type) {
        // Save notification to database
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.valueOf(type.toUpperCase()));
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        // Note: We would need to set the user, but for now we'll save without it
        // In a real implementation, you'd fetch the user from the repository
        Notification savedNotification = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket
        NotificationDTO notificationDTO = NotificationDTO.builder()
                .id(savedNotification.getId())
                .title(savedNotification.getTitle())
                .message(savedNotification.getMessage())
                .type(savedNotification.getType())
                .isRead(savedNotification.getIsRead())
                .createdAt(savedNotification.getCreatedAt())
                .build();
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                notificationDTO
        );
        
        log.info("Notification sent to user {}: {}", userId, title);
    }

    @Transactional
    public void broadcastNotification(String title, String message, String type) {
        // Save notification to database
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.valueOf(type.toUpperCase()));
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        
        // Send broadcast notification via WebSocket
        NotificationDTO notificationDTO = NotificationDTO.builder()
                .id(savedNotification.getId())
                .title(savedNotification.getTitle())
                .message(savedNotification.getMessage())
                .type(savedNotification.getType())
                .isRead(savedNotification.getIsRead())
                .createdAt(savedNotification.getCreatedAt())
                .build();
        
        // Broadcast to all subscribers
        messagingTemplate.convertAndSend("/topic/notifications", notificationDTO);
        
        log.info("Broadcast notification sent: {}", title);
    }
}
