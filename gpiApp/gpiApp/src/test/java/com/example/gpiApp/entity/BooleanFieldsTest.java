package com.example.gpiApp.entity;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

class BooleanFieldsTest {

    @Test
    void testAllUsersIsActive() {
        allUsers user = allUsers.builder()
                .email("test@example.com")
                .passwordHash("password")
                .firstName("John")
                .lastName("Doe")
                .isActive(true)
                .build();

        assertTrue(user.getIsActive());
        user.setIsActive(false);
        assertFalse(user.getIsActive());
    }

    @Test
    void testTaskCategoryIsActive() {
        TaskCategory category = TaskCategory.builder()
                .categoryName("Development")
                .description("Software development tasks")
                .colorCode("#007bff")
                .isActive(true)
                .build();

        assertTrue(category.getIsActive());
        category.setIsActive(false);
        assertFalse(category.getIsActive());
    }

    @Test
    void testTaskPriorityIsActive() {
        TaskPriority priority = TaskPriority.builder()
                .priorityName("High")
                .priorityLevel(1)
                .colorCode("#dc3545")
                .isActive(true)
                .build();

        assertTrue(priority.getIsActive());
        priority.setIsActive(false);
        assertFalse(priority.getIsActive());
    }

    @Test
    void testTeamIsActive() {
        Team team = Team.builder()
                .teamName("Development Team")
                .description("Software development team")
                .isActive(true)
                .build();

        assertTrue(team.getIsActive());
        team.setIsActive(false);
        assertFalse(team.getIsActive());
    }

    @Test
    void testNotificationTypeIsActive() {
        NotificationType notificationType = NotificationType.builder()
                .typeName("Task Assignment")
                .description("Notification for task assignments")
                .isActive(true)
                .build();

        assertTrue(notificationType.getIsActive());
        notificationType.setIsActive(false);
        assertFalse(notificationType.getIsActive());
    }

    @Test
    void testUserSessionIsActive() {
        UserSession session = UserSession.builder()
                .sessionToken("token123")
                .isActive(true)
                .build();

        assertTrue(session.getIsActive());
        session.setIsActive(false);
        assertFalse(session.getIsActive());
    }

    @Test
    void testUserTeamIsActive() {
        UserTeam userTeam = UserTeam.builder()
                .isActive(true)
                .build();

        assertTrue(userTeam.getIsActive());
        userTeam.setIsActive(false);
        assertFalse(userTeam.getIsActive());
    }

    @Test
    void testTaskFileIsDeliverable() {
        TaskFile taskFile = TaskFile.builder()
                .fileName("document.pdf")
                .fileUrl("https://example.com/file.pdf")
                .isDeliverable(true)
                .build();

        assertTrue(taskFile.getIsDeliverable());
        taskFile.setIsDeliverable(false);
        assertFalse(taskFile.getIsDeliverable());
    }

    @Test
    void testTaskDifficultyIsResolved() {
        TaskDifficulty difficulty = TaskDifficulty.builder()
                .difficultyLevel(TaskDifficulty.DifficultyLevel.HIGH)
                .isResolved(false)
                .build();

        assertFalse(difficulty.getIsResolved());
        difficulty.setIsResolved(true);
        assertTrue(difficulty.getIsResolved());
    }

    @Test
    void testDailyTaskScheduleIsCompleted() {
        DailyTaskSchedule schedule = DailyTaskSchedule.builder()
                .dayOfWeek(DailyTaskSchedule.DayOfWeek.MONDAY)
                .isCompleted(false)
                .build();

        assertFalse(schedule.getIsCompleted());
        schedule.setIsCompleted(true);
        assertTrue(schedule.getIsCompleted());
    }

    @Test
    void testCommentIsPrivate() {
        Comment comment = Comment.builder()
                .content("This is a private comment")
                .isPrivate(true)
                .build();

        assertTrue(comment.getIsPrivate());
        comment.setIsPrivate(false);
        assertFalse(comment.getIsPrivate());
    }

    @Test
    void testNotificationIsRead() {
        Notification notification = Notification.builder()
                .title("New Task")
                .message("You have been assigned a new task")
                .isRead(false)
                .build();

        assertFalse(notification.getIsRead());
        notification.setIsRead(true);
        assertTrue(notification.getIsRead());
    }

    @Test
    void testNotificationPreferenceBooleanFields() {
        NotificationPreference preference = NotificationPreference.builder()
                .emailEnabled(true)
                .pushEnabled(true)
                .smsEnabled(false)
                .build();

        assertTrue(preference.getEmailEnabled());
        assertTrue(preference.getPushEnabled());
        assertFalse(preference.getSmsEnabled());

        preference.setEmailEnabled(false);
        preference.setPushEnabled(false);
        preference.setSmsEnabled(true);

        assertFalse(preference.getEmailEnabled());
        assertFalse(preference.getPushEnabled());
        assertTrue(preference.getSmsEnabled());
    }

    @Test
    void testSystemSettingsIsEncrypted() {
        SystemSettings settings = SystemSettings.builder()
                .settingKey("database.password")
                .settingValue("encrypted_password")
                .isEncrypted(true)
                .build();

        assertTrue(settings.getIsEncrypted());
        settings.setIsEncrypted(false);
        assertFalse(settings.getIsEncrypted());
    }
} 