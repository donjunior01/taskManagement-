package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserNotificationPreferencesDTO;
import com.example.gpiApp.entity.UserNotificationPreferences;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserNotificationPreferencesRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserNotificationPreferencesService {

    private final UserNotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserNotificationPreferencesDTO> getAllPreferences() {
        return preferencesRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserNotificationPreferencesDTO getPreferencesByUserId(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .map(this::convertToDTO)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    @Transactional
    public UserNotificationPreferencesDTO createPreferences(UserNotificationPreferencesDTO request) {
        UserNotificationPreferences preferences = new UserNotificationPreferences();
        preferences.setEmailNotifications(request.getEmailNotifications() != null ? request.getEmailNotifications() : true);
        preferences.setPushNotifications(request.getPushNotifications() != null ? request.getPushNotifications() : true);
        preferences.setTaskDeadlineReminders(request.getTaskDeadlineReminders() != null ? request.getTaskDeadlineReminders() : true);
        preferences.setTaskAssignmentNotifications(request.getTaskAssignmentNotifications() != null ? request.getTaskAssignmentNotifications() : true);
        preferences.setProjectUpdateNotifications(request.getProjectUpdateNotifications() != null ? request.getProjectUpdateNotifications() : true);
        preferences.setCommentNotifications(request.getCommentNotifications() != null ? request.getCommentNotifications() : true);
        preferences.setMessageNotifications(request.getMessageNotifications() != null ? request.getMessageNotifications() : true);
        preferences.setDeadlineReminderHours(request.getDeadlineReminderHours() != null ? request.getDeadlineReminderHours() : 24);

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId()).ifPresent(preferences::setUser);
        }

        UserNotificationPreferences saved = preferencesRepository.save(preferences);
        log.info("Created notification preferences for user: {}", request.getUserId());
        return convertToDTO(saved);
    }

    @Transactional
    public UserNotificationPreferencesDTO updatePreferences(Long userId, UserNotificationPreferencesDTO request) {
        UserNotificationPreferences preferences = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserNotificationPreferences newPrefs = new UserNotificationPreferences();
                    userRepository.findById(userId).ifPresent(newPrefs::setUser);
                    return newPrefs;
                });

        if (request.getEmailNotifications() != null) preferences.setEmailNotifications(request.getEmailNotifications());
        if (request.getPushNotifications() != null) preferences.setPushNotifications(request.getPushNotifications());
        if (request.getTaskDeadlineReminders() != null) preferences.setTaskDeadlineReminders(request.getTaskDeadlineReminders());
        if (request.getTaskAssignmentNotifications() != null) preferences.setTaskAssignmentNotifications(request.getTaskAssignmentNotifications());
        if (request.getProjectUpdateNotifications() != null) preferences.setProjectUpdateNotifications(request.getProjectUpdateNotifications());
        if (request.getCommentNotifications() != null) preferences.setCommentNotifications(request.getCommentNotifications());
        if (request.getMessageNotifications() != null) preferences.setMessageNotifications(request.getMessageNotifications());
        if (request.getDeadlineReminderHours() != null) preferences.setDeadlineReminderHours(request.getDeadlineReminderHours());

        UserNotificationPreferences saved = preferencesRepository.save(preferences);
        log.info("Updated notification preferences for user: {}", userId);
        return convertToDTO(saved);
    }

    @Transactional
    public void deletePreferences(Long userId) {
        preferencesRepository.deleteByUserId(userId);
        log.info("Deleted notification preferences for user: {}", userId);
    }

    private UserNotificationPreferencesDTO createDefaultPreferences(Long userId) {
        UserNotificationPreferences preferences = UserNotificationPreferences.builder()
                .emailNotifications(true)
                .pushNotifications(true)
                .taskDeadlineReminders(true)
                .taskAssignmentNotifications(true)
                .projectUpdateNotifications(true)
                .commentNotifications(true)
                .messageNotifications(true)
                .deadlineReminderHours(24)
                .build();

        userRepository.findById(userId).ifPresent(preferences::setUser);
        UserNotificationPreferences saved = preferencesRepository.save(preferences);
        return convertToDTO(saved);
    }

    private UserNotificationPreferencesDTO convertToDTO(UserNotificationPreferences preferences) {
        return UserNotificationPreferencesDTO.builder()
                .id(preferences.getId())
                .userId(preferences.getUser() != null ? preferences.getUser().getId() : null)
                .userName(preferences.getUser() != null 
                        ? preferences.getUser().getFirstName() + " " + preferences.getUser().getLastName() 
                        : null)
                .emailNotifications(preferences.getEmailNotifications())
                .pushNotifications(preferences.getPushNotifications())
                .taskDeadlineReminders(preferences.getTaskDeadlineReminders())
                .taskAssignmentNotifications(preferences.getTaskAssignmentNotifications())
                .projectUpdateNotifications(preferences.getProjectUpdateNotifications())
                .commentNotifications(preferences.getCommentNotifications())
                .messageNotifications(preferences.getMessageNotifications())
                .deadlineReminderHours(preferences.getDeadlineReminderHours())
                .createdAt(preferences.getCreatedAt())
                .updatedAt(preferences.getUpdatedAt())
                .build();
    }
}
