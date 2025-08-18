package com.example.gpiApp.service;

import com.example.gpiApp.dto.NotificationDTO;
import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getNotificationsByUser(String username);
    boolean deleteNotification(Long id, String username);
    boolean markNotificationAsRead(Long id, String username);
    void createTaskAssignedNotification(String username, String taskTitle, Long taskId);
    void createProjectCreatedNotification(String username, String projectTitle, Long projectId);
    void createTaskCompletedNotification(String username, String taskTitle, Long taskId);
    void createTaskOverdueNotification(String username, String taskTitle, Long taskId);
    long getUnreadNotificationCount(String username);
}
