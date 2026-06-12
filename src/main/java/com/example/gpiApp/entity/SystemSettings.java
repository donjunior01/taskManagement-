package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Application-wide configuration managed from the admin "Configuration" page.
 * Single-row table — the singleton lives at id = 1.
 */
@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {

    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id;

    // ── Général ──────────────────────────────────────────────────────────────
    @Column(name = "app_name", nullable = false)
    @Builder.Default
    private String appName = "TaskMaster Pro";

    @Column(name = "default_language", nullable = false)
    @Builder.Default
    private String defaultLanguage = "Français";

    @Column(name = "timezone", nullable = false)
    @Builder.Default
    private String timezone = "Europe/Paris (UTC+1)";

    // ── Sécurité ─────────────────────────────────────────────────────────────
    @Column(name = "jwt_validity_minutes", nullable = false)
    @Builder.Default
    private Integer jwtValidityMinutes = 1440;

    @Column(name = "max_login_attempts", nullable = false)
    @Builder.Default
    private Integer maxLoginAttempts = 5;

    @Column(name = "lockout_duration_minutes", nullable = false)
    @Builder.Default
    private Integer lockoutDurationMinutes = 15;

    @Column(name = "password_min_length", nullable = false)
    @Builder.Default
    private Integer passwordMinLength = 12;

    @Column(name = "password_require_uppercase", nullable = false)
    @Builder.Default
    private Boolean passwordRequireUppercase = true;

    @Column(name = "password_require_digit", nullable = false)
    @Builder.Default
    private Boolean passwordRequireDigit = true;

    @Column(name = "password_require_special", nullable = false)
    @Builder.Default
    private Boolean passwordRequireSpecial = true;

    @Column(name = "password_expiry_days", nullable = false)
    @Builder.Default
    private Integer passwordExpiryDays = 90;

    @Column(name = "two_factor_required_admins", nullable = false)
    @Builder.Default
    private Boolean twoFactorRequiredAdmins = false;

    @Column(name = "maintenance_mode", nullable = false)
    @Builder.Default
    private Boolean maintenanceMode = false;

    // ── Notifications (SMTP) ─────────────────────────────────────────────────
    @Column(name = "smtp_host")
    @Builder.Default
    private String smtpHost = "smtp.gpi.app";

    @Column(name = "smtp_port")
    @Builder.Default
    private Integer smtpPort = 587;

    @Column(name = "smtp_username")
    @Builder.Default
    private String smtpUsername = "noreply@gpi.app";

    @Column(name = "smtp_password")
    @Builder.Default
    private String smtpPassword = "";

    @Column(name = "smtp_sender")
    @Builder.Default
    private String smtpSender = "TaskMaster Pro <noreply@gpi.app>";

    @Column(name = "notify_on_registration", nullable = false)
    @Builder.Default
    private Boolean notifyOnRegistration = true;

    @Column(name = "notify_on_task_assigned", nullable = false)
    @Builder.Default
    private Boolean notifyOnTaskAssigned = false;

    @Column(name = "notify_on_deliverable_submitted", nullable = false)
    @Builder.Default
    private Boolean notifyOnDeliverableSubmitted = true;

    @Column(name = "notify_on_suspicious_login", nullable = false)
    @Builder.Default
    private Boolean notifyOnSuspiciousLogin = true;

    @Column(name = "notify_on_project_overdue", nullable = false)
    @Builder.Default
    private Boolean notifyOnProjectOverdue = true;

    // ── Sauvegarde ───────────────────────────────────────────────────────────
    @Column(name = "backup_retention_days", nullable = false)
    @Builder.Default
    private Integer backupRetentionDays = 30;

    /** Max upload size in MB (admin-configurable, used for deliverables & message attachments). */
    @Column(name = "max_file_upload_mb", nullable = false)
    @Builder.Default
    private Integer maxFileUploadMb = 100;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
