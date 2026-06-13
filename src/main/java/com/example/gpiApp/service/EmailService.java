package com.example.gpiApp.service;

import com.example.gpiApp.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final BrevoEmailClient brevoClient;

    @Value("${spring.mail.from:noreply@taskmanagement.com}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    /** Email can be sent when Brevo (REST) is configured OR SMTP is explicitly enabled. */
    private boolean canSend() {
        return brevoClient.isEnabled() || emailEnabled;
    }

    /**
     * Send an email through Brevo's REST API when configured; otherwise fall back to SMTP
     * (JavaMailSender). Centralises delivery so every notification benefits from both paths.
     */
    private void dispatch(String to, String subject, String body) {
        if (brevoClient.isEnabled()) {
            brevoClient.send(to, subject, body);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    @Async
    public void sendDeadlineReminder(Task task, String recipientEmail) {
        if (!canSend()) {
            log.info("Email service is disabled. Skipping deadline reminder for task: {}", task.getName());
            return;
        }
        try {
            String deadline = task.getDeadline() != null
                    ? task.getDeadline().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"))
                    : "Not set";
            String body = String.format(
                    "Dear User,\n\n" +
                    "This is a reminder that your task '%s' is due on %s.\n\n" +
                    "Task Details:\n" +
                    "- Priority: %s\n" +
                    "- Status: %s\n" +
                    "- Progress: %d%%\n\n" +
                    "Please ensure you complete this task before the deadline.\n\n" +
                    "Best regards,\n" +
                    "Task Management System",
                    task.getName(), deadline, task.getPriority(), task.getStatus(), task.getProgress());

            dispatch(recipientEmail, "Task Deadline Reminder: " + task.getName(), body);
            log.info("Deadline reminder email sent to {} for task: {}", recipientEmail, task.getName());
        } catch (Exception e) {
            log.error("Failed to send deadline reminder email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendTaskAssignmentNotification(Task task, String recipientEmail) {
        if (!canSend()) {
            log.info("Email service is disabled. Skipping assignment notification for task: {}", task.getName());
            return;
        }
        try {
            String deadline = task.getDeadline() != null
                    ? task.getDeadline().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"))
                    : "Not set";
            String body = String.format(
                    "Dear User,\n\n" +
                    "You have been assigned a new task '%s'.\n\n" +
                    "Task Details:\n" +
                    "- Description: %s\n" +
                    "- Priority: %s\n" +
                    "- Deadline: %s\n\n" +
                    "Please log in to the system to view more details.\n\n" +
                    "Best regards,\n" +
                    "Task Management System",
                    task.getName(),
                    task.getDescription() != null ? task.getDescription() : "No description",
                    task.getPriority(), deadline);

            dispatch(recipientEmail, "New Task Assigned: " + task.getName(), body);
            log.info("Task assignment email sent to {} for task: {}", recipientEmail, task.getName());
        } catch (Exception e) {
            log.error("Failed to send task assignment email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    /**
     * Email a user their reset temporary password. When no provider is configured, this is a no-op
     * that just logs — the admin still sees the temporary password returned by the API.
     */
    @Async
    public void sendPasswordResetEmail(String recipientEmail, String temporaryPassword) {
        if (!canSend()) {
            log.info("Email service is disabled. Skipping password-reset email to {}.", recipientEmail);
            return;
        }
        try {
            String body =
                    "Bonjour,\n\n" +
                    "Votre mot de passe a été réinitialisé par un administrateur.\n\n" +
                    "Mot de passe temporaire : " + temporaryPassword + "\n\n" +
                    "Veuillez vous connecter avec ce mot de passe puis le modifier immédiatement " +
                    "depuis votre profil.\n\n" +
                    "Cordialement,\n" +
                    "L'équipe TaskMaster Pro";
            dispatch(recipientEmail, "Réinitialisation de votre mot de passe — TaskMaster Pro", body);
            log.info("Password-reset email sent to {}.", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send password-reset email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendProjectUpdateNotification(String projectName, String updateType, String recipientEmail) {
        if (!canSend()) {
            log.info("Email service is disabled. Skipping project update notification for: {}", projectName);
            return;
        }
        try {
            String body = String.format(
                    "Dear User,\n\n" +
                    "There has been an update to the project '%s'.\n\n" +
                    "Update Type: %s\n\n" +
                    "Please log in to the system to view more details.\n\n" +
                    "Best regards,\n" +
                    "Task Management System",
                    projectName, updateType);

            dispatch(recipientEmail, "Project Update: " + projectName, body);
            log.info("Project update email sent to {} for project: {}", recipientEmail, projectName);
        } catch (Exception e) {
            log.error("Failed to send project update email to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
