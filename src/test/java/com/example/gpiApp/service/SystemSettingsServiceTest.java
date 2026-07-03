package com.example.gpiApp.service;

import com.example.gpiApp.entity.SystemSettings;
import com.example.gpiApp.repository.SystemSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;

/**
 * Security-critical unit tests for the configuration policy helpers (no database).
 * Covers the password policy and the registration email-domain gate.
 */
@ExtendWith(MockitoExtension.class)
class SystemSettingsServiceTest {

    @Mock private SystemSettingsRepository repository;
    @Mock private ActivityLogService activityLogService;
    @InjectMocks private SystemSettingsService service;

    /** Point getSettings() at a fixed settings row regardless of the (null) tenant context. */
    private void withSettings(SystemSettings s) {
        lenient().when(repository.findByOrganizationId(anyLong())).thenReturn(Optional.of(s));
    }

    private SystemSettings policy(int min, boolean upper, boolean digit, boolean special) {
        return SystemSettings.builder()
                .passwordMinLength(min)
                .passwordRequireUppercase(upper)
                .passwordRequireDigit(digit)
                .passwordRequireSpecial(special)
                .build();
    }

    // ── Password policy ──
    @Test
    void rejectsPasswordShorterThanMinLength() {
        withSettings(policy(12, true, true, true));
        assertThat(service.validatePassword("Ab1!")).isNotNull();
    }

    @Test
    void rejectsPasswordMissingAnUppercase() {
        withSettings(policy(8, true, true, true));
        assertThat(service.validatePassword("abcdef1!")).isNotNull();
    }

    @Test
    void rejectsPasswordMissingADigitOrSpecial() {
        withSettings(policy(8, true, true, true));
        assertThat(service.validatePassword("Abcdefgh")).isNotNull();   // no digit, no special
    }

    @Test
    void acceptsAPasswordThatMeetsEveryRule() {
        withSettings(policy(12, true, true, true));
        assertThat(service.validatePassword("Str0ng!Passw0rd")).isNull();
    }

    @Test
    void honoursRelaxedPolicyWhenRulesAreOff() {
        withSettings(policy(4, false, false, false));
        assertThat(service.validatePassword("abcd")).isNull();
    }

    // ── Email-domain gate ──
    @Test
    void allowsAnyDomainWhenNoAllowListIsSet() {
        withSettings(SystemSettings.builder().allowedEmailDomains("").build());
        assertThat(service.validateEmailDomain("anyone@wherever.com")).isNull();
    }

    @Test
    void allowsMatchingDomainCaseInsensitively() {
        withSettings(SystemSettings.builder().allowedEmailDomains("taskmaster.com, acme.com").build());
        assertThat(service.validateEmailDomain("Jane@TaskMaster.com")).isNull();
        assertThat(service.validateEmailDomain("bob@acme.com")).isNull();
    }

    @Test
    void rejectsADomainOutsideTheAllowList() {
        withSettings(SystemSettings.builder().allowedEmailDomains("taskmaster.com").build());
        assertThat(service.validateEmailDomain("intruder@gmail.com")).isNotNull();
    }

    @Test
    void normalisesStoredDomainsAndReadsThemBack() {
        withSettings(SystemSettings.builder().allowedEmailDomains("  @TaskMaster.com , acme.com ,, ").build());
        assertThat(service.getAllowedEmailDomains()).containsExactly("taskmaster.com", "acme.com");
    }

    // ── Registration toggle ──
    @Test
    void reportsRegistrationEnabledFlag() {
        withSettings(SystemSettings.builder().registrationEnabled(false).build());
        assertThat(service.isRegistrationEnabled()).isFalse();
    }
}
