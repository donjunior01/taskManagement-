package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.NotificationRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            return List.of();
        }
        Long userId = userOpt.get().getUserId();
        return notificationRepository.findByUserIdOrderBySentAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean deleteNotification(Long id, String username) {
        if (!notificationRepository.existsById(id)) return false;
        notificationRepository.deleteById(id);
        return true;
    }

    private NotificationDTO toDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getNotificationId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getNotificationType() != null ? notification.getNotificationType().getTypeName() : null);
        dto.setRecipient(notification.getUser() != null ? notification.getUser().getEmail() : null);
        dto.setRead(Boolean.TRUE.equals(notification.getIsRead()));
        dto.setCreatedAt(notification.getSentAt());
        dto.setReadAt(notification.getReadAt());
        return dto;
    }
}
