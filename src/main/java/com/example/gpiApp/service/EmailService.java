package com.example.gpiApp.service;

import com.example.gpiApp.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@taskmanagement.com}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Async
    public void sendDeadlineReminder(Task task, String recipientEmail) {
        if (!emailEnabled) {
            log.info("Email service is disabled. Skipping deadline reminder for task: {}", task.getName());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Task Deadline Reminder: " + task.getName());
            
            String deadline = task.getDeadline() != null 
                    ? task.getDeadline().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"))
                    : "Not set";
            
            String emailBody = String.format(
                    "Dear User,\n\n" +
                    "This is a reminder that your task '%s' is due on %s.\n\n" +
                    "Task Details:\n" +
                    "- Priority: %s\n" +
                    "- Status: %s\n" +
                    "- Progress: %d%%\n\n" +
                    "Please ensure you complete this task before the deadline.\n\n" +
                    "Best regards,\n" +
                    "Task Management System",
                    task.getName(),
                    deadline,
                    task.getPriority(),
                    task.getStatus(),
                    task.getProgress()
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Deadline reminder email sent to {} for task: {}", recipientEmail, task.getName());
        } catch (Exception e) {
            log.error("Failed to send deadline reminder email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendTaskAssignmentNotification(Task task, String recipientEmail) {
        if (!emailEnabled) {
            log.info("Email service is disabled. Skipping assignment notification for task: {}", task.getName());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("New Task Assigned: " + task.getName());
            
            String deadline = task.getDeadline() != null 
                    ? task.getDeadline().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"))
                    : "Not set";
            
            String emailBody = String.format(
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
                    task.getPriority(),
                    deadline
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Task assignment email sent to {} for task: {}", recipientEmail, task.getName());
        } catch (Exception e) {
            log.error("Failed to send task assignment email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendProjectUpdateNotification(String projectName, String updateType, String recipientEmail) {
        if (!emailEnabled) {
            log.info("Email service is disabled. Skipping project update notification for: {}", projectName);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Project Update: " + projectName);
            
            String emailBody = String.format(
                    "Dear User,\n\n" +
                    "There has been an update to the project '%s'.\n\n" +
                    "Update Type: %s\n\n" +
                    "Please log in to the system to view more details.\n\n" +
                    "Best regards,\n" +
                    "Task Management System",
                    projectName,
                    updateType
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Project update email sent to {} for project: {}", recipientEmail, projectName);
        } catch (Exception e) {
            log.error("Failed to send project update email to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
