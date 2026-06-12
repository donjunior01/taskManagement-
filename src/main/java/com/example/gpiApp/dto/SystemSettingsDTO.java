package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Carrier for the admin Configuration screen (General + Security tabs).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingsDTO {
    // Général
    private String appName;
    private String defaultLanguage;
    private String timezone;

    // Sécurité
    private Integer jwtValidityMinutes;
    private Integer maxLoginAttempts;
    private Integer lockoutDurationMinutes;
    private Integer passwordMinLength;
    private Boolean passwordRequireUppercase;
    private Boolean passwordRequireDigit;
    private Boolean passwordRequireSpecial;
    private Integer passwordExpiryDays;
    private Boolean twoFactorRequiredAdmins;
    private Boolean maintenanceMode;

    // Notifications
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String smtpSender;
    private Boolean notifyOnRegistration;
    private Boolean notifyOnTaskAssigned;
    private Boolean notifyOnDeliverableSubmitted;
    private Boolean notifyOnSuspiciousLogin;
    private Boolean notifyOnProjectOverdue;

    // Sauvegarde
    private Integer backupRetentionDays;

    // Général (uploads)
    private Integer maxFileUploadMb;
}
