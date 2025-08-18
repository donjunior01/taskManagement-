package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.NotificationDTO;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.NotificationType;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.NotificationRepository;
import com.example.gpiApp.repository.NotificationTypeRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationTypeRepository notificationTypeRepository;

    /**
     * Internal utility class to manage user identification and username generation
     */
    private static class UserManager {
        
        /**
         * Generate a username from first and last name
         */
        public static String generateUsername(String firstName, String lastName) {
            if (firstName == null || lastName == null) {
                return null;
            }
            return (firstName.toLowerCase() + "." + lastName.toLowerCase()).replaceAll("\\s+", "");
        }
        
        /**
         * Find user by generated username (first.last format)
         */
        public static allUsers findUserByGeneratedUsername(List<allUsers> allUsers, String generatedUsername) {
            return allUsers.stream()
                    .filter(user -> generatedUsername.equals(generateUsername(user.getFirstName(), user.getLastName())))
                    .findFirst()
                    .orElse(null);
        }
        
        /**
         * Find user by email (since email is unique and serves as username in the entity)
         */
        public static allUsers findUserByEmail(List<allUsers> allUsers, String email) {
            return allUsers.stream()
                    .filter(user -> email.equals(user.getEmail()))
                    .findFirst()
                    .orElse(null);
        }
        
        /**
         * Find user by first and last name combination
         */
        public static allUsers findUserByName(List<allUsers> allUsers, String firstName, String lastName) {
            return allUsers.stream()
                    .filter(user -> firstName.equals(user.getFirstName()) && lastName.equals(user.getLastName()))
                    .findFirst()
                    .orElse(null);
        }
    }

    @Override
    public List<NotificationDTO> getNotificationsByUser(String username) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            List<Notification> notifications = notificationRepository.findByUserIdOrderBySentAtDesc(finalUser.getUserId());
            
            return notifications.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Return empty list if there's an error
            return List.of();
        }
    }

    @Override
    public boolean deleteNotification(Long id, String username) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
            
            // Check if the notification belongs to the user
            if (!notification.getUser().getUserId().equals(finalUser.getUserId())) {
                return false;
            }
            
            notificationRepository.delete(notification);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean markNotificationAsRead(Long id, String username) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
            
            // Check if the notification belongs to the user
            if (!notification.getUser().getUserId().equals(finalUser.getUserId())) {
                return false;
            }
            
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void createTaskAssignedNotification(String username, String taskTitle, Long taskId) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            NotificationType taskAssignedType = notificationTypeRepository.findByTypeName("TASK_ASSIGNED")
                    .orElseGet(() -> createDefaultTaskAssignedType());
            
            Notification notification = Notification.builder()
                    .user(finalUser)
                    .notificationType(taskAssignedType)
                    .title("Task Assigned")
                    .message("You have been assigned a new task: " + taskTitle)
                    .actionUrl("/user/task-details/" + taskId)
                    .isRead(false)
                    .priority(Notification.NotificationPriority.NORMAL)
                    .metadata("{\"taskId\": " + taskId + "}")
                    .sentAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();
            
            notificationRepository.save(notification);
        } catch (Exception e) {
            // Log error but don't throw exception to avoid breaking the main flow
            System.err.println("Failed to create task assigned notification: " + e.getMessage());
        }
    }

    @Override
    public void createProjectCreatedNotification(String username, String projectTitle, Long projectId) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            NotificationType projectCreatedType = notificationTypeRepository.findByTypeName("PROJECT_CREATED")
                    .orElseGet(() -> createDefaultProjectCreatedType());
            
            Notification notification = Notification.builder()
                    .user(finalUser)
                    .notificationType(projectCreatedType)
                    .title("Project Created")
                    .message("A new project has been created: " + projectTitle)
                    .actionUrl("/project-manager/pmDashboard")
                    .isRead(false)
                    .priority(Notification.NotificationPriority.NORMAL)
                    .metadata("{\"projectId\": " + projectId + "}")
                    .sentAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();
            
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Failed to create project created notification: " + e.getMessage());
        }
    }

    @Override
    public void createTaskCompletedNotification(String username, String taskTitle, Long taskId) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            NotificationType taskCompletedType = notificationTypeRepository.findByTypeName("TASK_COMPLETED")
                    .orElseGet(() -> createDefaultTaskCompletedType());
            
            Notification notification = Notification.builder()
                    .user(finalUser)
                    .notificationType(taskCompletedType)
                    .title("Task Completed")
                    .message("Task has been completed: " + taskTitle)
                    .actionUrl("/user/task-details/" + taskId)
                    .isRead(false)
                    .priority(Notification.NotificationPriority.NORMAL)
                    .metadata("{\"taskId\": " + taskId + "}")
                    .sentAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();
            
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Failed to create task completed notification: " + e.getMessage());
        }
    }

    @Override
    public void createTaskOverdueNotification(String username, String taskTitle, Long taskId) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            NotificationType taskOverdueType = notificationTypeRepository.findByTypeName("TASK_OVERDUE")
                    .orElseGet(() -> createDefaultTaskOverdueType());
            
            Notification notification = Notification.builder()
                    .user(finalUser)
                    .notificationType(taskOverdueType)
                    .title("Task Overdue")
                    .message("Task is overdue: " + taskTitle)
                    .actionUrl("/user/task-details/" + taskId)
                    .isRead(false)
                    .priority(Notification.NotificationPriority.HIGH)
                    .metadata("{\"taskId\": " + taskId + "}")
                    .sentAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(3))
                    .build();
            
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Failed to create task overdue notification: " + e.getMessage());
        }
    }

    @Override
    public long getUnreadNotificationCount(String username) {
        try {
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user == null) {
                throw new RuntimeException("User not found: " + username);
            }
            
            final allUsers finalUser = user; // Make effectively final
            return notificationRepository.countUnreadNotificationsByUser(finalUser.getUserId());
        } catch (Exception e) {
            return 0;
        }
    }

    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getNotificationId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getNotificationType().getTypeName());
        
        // Generate username from user's first and last name
        if (notification.getUser() != null) {
            dto.setRecipient(UserManager.generateUsername(
                notification.getUser().getFirstName(), 
                notification.getUser().getLastName()
            ));
        } else {
            dto.setRecipient(null);
        }
        
        dto.setRead(notification.getIsRead());
        dto.setCreatedAt(notification.getSentAt());
        dto.setReadAt(notification.getReadAt());
        return dto;
    }

    private NotificationType createDefaultTaskAssignedType() {
        NotificationType type = NotificationType.builder()
                .typeName("TASK_ASSIGNED")
                .description("Notification when a task is assigned")
                .isActive(true)
                .defaultSettings("{\"email\": true, \"push\": true, \"sms\": false}")
                .build();
        return notificationTypeRepository.save(type);
    }

    private NotificationType createDefaultProjectCreatedType() {
        NotificationType type = NotificationType.builder()
                .typeName("PROJECT_CREATED")
                .description("Notification when a project is created")
                .isActive(true)
                .defaultSettings("{\"email\": true, \"push\": true, \"sms\": false}")
                .build();
        return notificationTypeRepository.save(type);
    }

    private NotificationType createDefaultTaskCompletedType() {
        NotificationType type = NotificationType.builder()
                .typeName("TASK_COMPLETED")
                .description("Notification when a task is completed")
                .isActive(true)
                .defaultSettings("{\"email\": true, \"push\": true, \"sms\": false}")
                .build();
        return notificationTypeRepository.save(type);
    }

    private NotificationType createDefaultTaskOverdueType() {
        NotificationType type = NotificationType.builder()
                .typeName("TASK_OVERDUE")
                .description("Notification for overdue tasks")
                .isActive(true)
                .defaultSettings("{\"email\": true, \"push\": true, \"sms\": true}")
                .build();
        return notificationTypeRepository.save(type);
    }
}
