package com.example.gpiApp.service;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.exception.ResourceNotFoundException;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Manages per-user two-factor (TOTP) enrolment: provisioning a secret, enabling after the
 * user proves possession with a valid code, and disabling.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private static final String ISSUER = "TaskMaster Pro";

    private final UserRepository userRepository;
    private final TotpService totpService;

    @Transactional(readOnly = true)
    public boolean isEnabled(Long userId) {
        return userRepository.findById(userId)
                .map(allUsers::isTwoFactorEnabled)
                .orElse(false);
    }

    /**
     * Generate (or regenerate) a secret for the user and return the secret plus the
     * otpauth URI to add to an authenticator app. Does NOT enable 2FA yet.
     */
    @Transactional
    public Map<String, String> setup(Long userId) {
        allUsers user = getUser(userId);
        String secret = totpService.generateSecret();
        user.setTwoFactorSecret(secret);
        user.setTwoFactorEnabled(false); // not active until verified
        userRepository.save(user);
        String uri = totpService.buildOtpAuthUri(secret, user.getEmail(), ISSUER);
        return Map.of("secret", secret, "otpauthUri", uri);
    }

    /** Verify the first code and, if valid, switch 2FA on. */
    @Transactional
    public boolean enable(Long userId, String code) {
        allUsers user = getUser(userId);
        if (user.getTwoFactorSecret() == null || !totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            return false;
        }
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        return true;
    }

    /** Require a valid code (or the user could be locked out) before turning 2FA off. */
    @Transactional
    public boolean disable(Long userId, String code) {
        allUsers user = getUser(userId);
        if (!user.isTwoFactorEnabled()) return true;
        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            return false;
        }
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        return true;
    }

    private allUsers getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}
