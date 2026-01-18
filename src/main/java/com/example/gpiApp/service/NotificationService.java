package com.example.gpiApp.service;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.NotificationRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public PagedResponse<NotificationDTO> getUserNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        List<NotificationDTO> dtos = notificationPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(
                dtos,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.isFirst(),
                notificationPage.isLast()
        );
    }

    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public ApiResponse<Void> markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
        return ApiResponse.success("Notification marked as read", null);
    }

    @Transactional
    public ApiResponse<Void> markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        return ApiResponse.success("All notifications marked as read", null);
    }

    @Transactional
    public NotificationDTO createNotification(Long userId, String title, String message, 
            Notification.NotificationType type, Long referenceId, String referenceType) {
        allUsers user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        
        return convertToDTO(notificationRepository.save(notification));
    }

    // Helper methods for common notification types
    public void notifyNewMessage(Long recipientId, Long senderId, String senderName, Long messageId) {
        createNotification(
                recipientId,
                "New Message",
                "You have a new message from " + senderName,
                Notification.NotificationType.MESSAGE,
                messageId,
                "MESSAGE"
        );
    }

    public void notifyTaskAssigned(Long userId, String taskName, Long taskId) {
        createNotification(
                userId,
                "Task Assigned",
                "You have been assigned to task: " + taskName,
                Notification.NotificationType.TASK_ASSIGNED,
                taskId,
                "TASK"
        );
    }

    public void notifyTaskUpdated(Long userId, String taskName, Long taskId) {
        createNotification(
                userId,
                "Task Updated",
                "Task '" + taskName + "' has been updated",
                Notification.NotificationType.TASK_UPDATED,
                taskId,
                "TASK"
        );
    }

    public void notifyTaskCompleted(Long userId, String taskName, Long taskId) {
        createNotification(
                userId,
                "Task Completed",
                "Task '" + taskName + "' has been marked as completed",
                Notification.NotificationType.TASK_COMPLETED,
                taskId,
                "TASK"
        );
    }

    public void notifyDeliverableDue(Long userId, String deliverableName, Long deliverableId) {
        createNotification(
                userId,
                "Deliverable Due",
                "Deliverable '" + deliverableName + "' is due soon",
                Notification.NotificationType.DELIVERABLE_DUE,
                deliverableId,
                "DELIVERABLE"
        );
    }

    public void notifyProjectUpdate(Long userId, String projectName, Long projectId, String updateMessage) {
        createNotification(
                userId,
                "Project Update",
                updateMessage != null ? updateMessage : "Project '" + projectName + "' has been updated",
                Notification.NotificationType.PROJECT_UPDATE,
                projectId,
                "PROJECT"
        );
    }

    @Transactional
    public ApiResponse<Void> deleteNotification(Long notificationId) {
        if (notificationRepository.existsById(notificationId)) {
            notificationRepository.deleteById(notificationId);
            return ApiResponse.success("Notification deleted", null);
        }
        return ApiResponse.error("Notification not found");
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}

