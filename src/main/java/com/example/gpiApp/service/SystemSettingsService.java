package com.example.gpiApp.service;

import com.example.gpiApp.dto.SystemSettingsDTO;
import com.example.gpiApp.entity.SystemSettings;
import com.example.gpiApp.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads and persists the application-wide configuration singleton, and exposes
 * helpers so the rest of the app (registration, JWT issuance) honours the policy.
 */
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository repository;

    /** Fetch the singleton, creating a default row on first access. */
    @Transactional
    public SystemSettings getSettings() {
        return repository.findById(SystemSettings.SINGLETON_ID)
                .orElseGet(() -> {
                    SystemSettings created = SystemSettings.builder()
                            .id(SystemSettings.SINGLETON_ID)
                            .build();
                    return repository.save(created);
                });
    }

    public SystemSettingsDTO getSettingsDTO() {
        return toDTO(getSettings());
    }

    /** Public password policy — safe for the unauthenticated registration page. */
    public com.example.gpiApp.dto.PasswordPolicyDTO getPasswordPolicy() {
        SystemSettings s = getSettings();
        return com.example.gpiApp.dto.PasswordPolicyDTO.builder()
                .minLength(s.getPasswordMinLength())
                .requireUppercase(s.getPasswordRequireUppercase())
                .requireDigit(s.getPasswordRequireDigit())
                .requireSpecial(s.getPasswordRequireSpecial())
                .build();
    }

    /**
     * Human language name for AI prompts, derived from the admin-configured default language
     * (Configuration → Général). Drives the language the AI assistant replies in.
     */
    public String getAiLanguageName() {
        try {
            String lang = getSettings().getDefaultLanguage();
            if (lang == null || lang.isBlank()) return "French";
            String l = lang.toLowerCase();
            if (l.contains("fran")) return "French";
            if (l.contains("eng")) return "English";
            return lang;
        } catch (Exception e) {
            return "French";
        }
    }

    /** Public branding payload (app name, logo, PDF colours) — safe for unauthenticated pages. */
    public com.example.gpiApp.dto.BrandingDTO getBranding() {
        SystemSettings s = getSettings();
        return com.example.gpiApp.dto.BrandingDTO.builder()
                .appName(s.getAppName())
                .logoUrl(s.getLogoUrl())
                .pdfHeaderColor(s.getPdfHeaderColor())
                .pdfFooterColor(s.getPdfFooterColor())
                .pdfFooterText(s.getPdfFooterText())
                .build();
    }

    @Transactional
    public SystemSettingsDTO updateGeneral(SystemSettingsDTO dto) {
        SystemSettings s = getSettings();
        if (dto.getAppName() != null && !dto.getAppName().trim().isEmpty()) s.setAppName(dto.getAppName().trim());
        // logoUrl: empty string clears the logo; null means "unchanged".
        if (dto.getLogoUrl() != null) s.setLogoUrl(dto.getLogoUrl().trim().isEmpty() ? null : dto.getLogoUrl().trim());
        if (dto.getPdfHeaderColor() != null && !dto.getPdfHeaderColor().trim().isEmpty()) s.setPdfHeaderColor(dto.getPdfHeaderColor().trim());
        if (dto.getPdfFooterColor() != null && !dto.getPdfFooterColor().trim().isEmpty()) s.setPdfFooterColor(dto.getPdfFooterColor().trim());
        if (dto.getPdfFooterText() != null) s.setPdfFooterText(dto.getPdfFooterText().trim());
        if (dto.getDefaultLanguage() != null) s.setDefaultLanguage(dto.getDefaultLanguage());
        if (dto.getTimezone() != null) s.setTimezone(dto.getTimezone());
        if (dto.getMaxFileUploadMb() != null) s.setMaxFileUploadMb(Math.min(100, Math.max(1, dto.getMaxFileUploadMb())));
        return toDTO(repository.save(s));
    }

    @Transactional
    public SystemSettingsDTO updateSecurity(SystemSettingsDTO dto) {
        SystemSettings s = getSettings();
        if (dto.getJwtValidityMinutes() != null) s.setJwtValidityMinutes(Math.max(5, dto.getJwtValidityMinutes()));
        if (dto.getMaxLoginAttempts() != null) s.setMaxLoginAttempts(Math.max(1, dto.getMaxLoginAttempts()));
        if (dto.getLockoutDurationMinutes() != null) s.setLockoutDurationMinutes(Math.max(1, dto.getLockoutDurationMinutes()));
        if (dto.getPasswordMinLength() != null) s.setPasswordMinLength(Math.min(64, Math.max(4, dto.getPasswordMinLength())));
        if (dto.getPasswordRequireUppercase() != null) s.setPasswordRequireUppercase(dto.getPasswordRequireUppercase());
        if (dto.getPasswordRequireDigit() != null) s.setPasswordRequireDigit(dto.getPasswordRequireDigit());
        if (dto.getPasswordRequireSpecial() != null) s.setPasswordRequireSpecial(dto.getPasswordRequireSpecial());
        if (dto.getPasswordExpiryDays() != null) s.setPasswordExpiryDays(Math.max(0, dto.getPasswordExpiryDays()));
        if (dto.getTwoFactorRequiredAdmins() != null) s.setTwoFactorRequiredAdmins(dto.getTwoFactorRequiredAdmins());
        if (dto.getMaintenanceMode() != null) s.setMaintenanceMode(dto.getMaintenanceMode());
        return toDTO(repository.save(s));
    }

    @Transactional
    public SystemSettingsDTO updateNotifications(SystemSettingsDTO dto) {
        SystemSettings s = getSettings();
        if (dto.getSmtpHost() != null) s.setSmtpHost(dto.getSmtpHost());
        if (dto.getSmtpPort() != null) s.setSmtpPort(dto.getSmtpPort());
        if (dto.getSmtpUsername() != null) s.setSmtpUsername(dto.getSmtpUsername());
        // A masked placeholder ("••••") means "unchanged" — never overwrite the stored secret with bullets.
        if (dto.getSmtpPassword() != null && !dto.getSmtpPassword().contains("•")) s.setSmtpPassword(dto.getSmtpPassword());
        if (dto.getSmtpSender() != null) s.setSmtpSender(dto.getSmtpSender());
        if (dto.getNotifyOnRegistration() != null) s.setNotifyOnRegistration(dto.getNotifyOnRegistration());
        if (dto.getNotifyOnTaskAssigned() != null) s.setNotifyOnTaskAssigned(dto.getNotifyOnTaskAssigned());
        if (dto.getNotifyOnDeliverableSubmitted() != null) s.setNotifyOnDeliverableSubmitted(dto.getNotifyOnDeliverableSubmitted());
        if (dto.getNotifyOnSuspiciousLogin() != null) s.setNotifyOnSuspiciousLogin(dto.getNotifyOnSuspiciousLogin());
        if (dto.getNotifyOnProjectOverdue() != null) s.setNotifyOnProjectOverdue(dto.getNotifyOnProjectOverdue());
        return toDTO(repository.save(s));
    }

    @Transactional
    public SystemSettingsDTO updateBackup(SystemSettingsDTO dto) {
        SystemSettings s = getSettings();
        if (dto.getBackupRetentionDays() != null) s.setBackupRetentionDays(Math.max(1, dto.getBackupRetentionDays()));
        if (dto.getMaintenanceMode() != null) s.setMaintenanceMode(dto.getMaintenanceMode());
        return toDTO(repository.save(s));
    }

    /**
     * Generate a simple, human-friendly temporary password that satisfies the active policy
     * (used by the admin "reset password" action). A 4-digit random suffix keeps each reset unique.
     */
    public String generateCompliantPassword() {
        SystemSettings s = getSettings();
        int min = (s.getPasswordMinLength() != null) ? s.getPasswordMinLength() : 8;
        boolean special = !Boolean.FALSE.equals(s.getPasswordRequireSpecial());
        int suffix = 1000 + (int) (Math.random() * 9000); // 1000-9999
        // "TaskMaster" gives upper+lowercase, the suffix gives digits, '@' gives a special char.
        StringBuilder pw = new StringBuilder("TaskMaster").append(special ? "@" : "M").append(suffix);
        // Pad to the configured minimum length if necessary.
        while (pw.length() < min) {
            pw.append((char) ('a' + (int) (Math.random() * 26)));
        }
        return pw.toString();
    }

    /** Max upload size in bytes, honouring the admin-configured limit (default 100 MB). */
    public long getMaxUploadBytes() {
        try {
            Integer mb = getSettings().getMaxFileUploadMb();
            return (mb != null ? mb : 100) * 1024L * 1024L;
        } catch (Exception e) {
            return 100L * 1024L * 1024L;
        }
    }

    /** Whether the platform is in maintenance mode (non-admins should be blocked at login). */
    public boolean isMaintenanceMode() {
        try {
            return Boolean.TRUE.equals(getSettings().getMaintenanceMode());
        } catch (Exception e) {
            return false;
        }
    }

    /** JWT lifetime in milliseconds, honouring the configured policy. */
    public long getJwtValidityMillis() {
        try {
            return getSettings().getJwtValidityMinutes() * 60_000L;
        } catch (Exception e) {
            return 86_400_000L; // 24h fallback
        }
    }

    /**
     * Validate a raw password against the active policy.
     * @return a human-readable (French) error message, or {@code null} when the password is acceptable.
     */
    public String validatePassword(String password) {
        SystemSettings s = getSettings();
        if (password == null || password.length() < s.getPasswordMinLength()) {
            return "Le mot de passe doit contenir au moins " + s.getPasswordMinLength() + " caractères.";
        }
        if (Boolean.TRUE.equals(s.getPasswordRequireUppercase()) && !password.matches(".*[A-Z].*")) {
            return "Le mot de passe doit contenir au moins une majuscule.";
        }
        if (Boolean.TRUE.equals(s.getPasswordRequireDigit()) && !password.matches(".*[0-9].*")) {
            return "Le mot de passe doit contenir au moins un chiffre.";
        }
        if (Boolean.TRUE.equals(s.getPasswordRequireSpecial()) && !password.matches(".*[^A-Za-z0-9].*")) {
            return "Le mot de passe doit contenir au moins un caractère spécial.";
        }
        return null;
    }

    private SystemSettingsDTO toDTO(SystemSettings s) {
        return SystemSettingsDTO.builder()
                .appName(s.getAppName())
                .logoUrl(s.getLogoUrl())
                .pdfHeaderColor(s.getPdfHeaderColor())
                .pdfFooterColor(s.getPdfFooterColor())
                .pdfFooterText(s.getPdfFooterText())
                .defaultLanguage(s.getDefaultLanguage())
                .timezone(s.getTimezone())
                .jwtValidityMinutes(s.getJwtValidityMinutes())
                .maxLoginAttempts(s.getMaxLoginAttempts())
                .lockoutDurationMinutes(s.getLockoutDurationMinutes())
                .passwordMinLength(s.getPasswordMinLength())
                .passwordRequireUppercase(s.getPasswordRequireUppercase())
                .passwordRequireDigit(s.getPasswordRequireDigit())
                .passwordRequireSpecial(s.getPasswordRequireSpecial())
                .passwordExpiryDays(s.getPasswordExpiryDays())
                .twoFactorRequiredAdmins(s.getTwoFactorRequiredAdmins())
                .maintenanceMode(s.getMaintenanceMode())
                .smtpHost(s.getSmtpHost())
                .smtpPort(s.getSmtpPort())
                .smtpUsername(s.getSmtpUsername())
                // Never expose the stored SMTP secret — return a masked placeholder.
                .smtpPassword((s.getSmtpPassword() != null && !s.getSmtpPassword().isEmpty()) ? "••••••••••••" : "")
                .smtpSender(s.getSmtpSender())
                .notifyOnRegistration(s.getNotifyOnRegistration())
                .notifyOnTaskAssigned(s.getNotifyOnTaskAssigned())
                .notifyOnDeliverableSubmitted(s.getNotifyOnDeliverableSubmitted())
                .notifyOnSuspiciousLogin(s.getNotifyOnSuspiciousLogin())
                .notifyOnProjectOverdue(s.getNotifyOnProjectOverdue())
                .backupRetentionDays(s.getBackupRetentionDays())
                .maxFileUploadMb(s.getMaxFileUploadMb())
                .build();
    }
}
