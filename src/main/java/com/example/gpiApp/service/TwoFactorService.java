package com.example.gpiApp.service;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.exception.ResourceNotFoundException;
import com.example.gpiApp.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Manages per-user two-factor (TOTP) enrolment: provisioning a secret (stored encrypted at rest),
 * enabling after the user proves possession with a valid code, issuing one-time recovery codes,
 * verifying TOTP-or-recovery codes at login, and disabling.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private static final String ISSUER = "TaskMaster Pro";
    private static final int RECOVERY_CODE_COUNT = 10;
    private static final String RC_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final TotpService totpService;
    private final EncryptionService encryptionService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public boolean isEnabled(Long userId) {
        return userRepository.findById(userId)
                .map(allUsers::isTwoFactorEnabled)
                .orElse(false);
    }

    /** Provision a secret (stored encrypted) and return it + the otpauth URI. Does NOT enable 2FA yet. */
    @Transactional
    public Map<String, String> setup(Long userId) {
        allUsers user = getUser(userId);
        String secret = totpService.generateSecret();
        user.setTwoFactorSecret(encryptionService.encrypt(secret)); // encrypted at rest
        user.setTwoFactorEnabled(false);
        userRepository.save(user);
        String uri = totpService.buildOtpAuthUri(secret, user.getEmail(), ISSUER);
        return Map.of("secret", secret, "otpauthUri", uri);
    }

    /** Verify the first code; on success enable 2FA, generate recovery codes and return them (shown once). */
    @Transactional
    public List<String> enable(Long userId, String code) {
        allUsers user = getUser(userId);
        String secret = encryptionService.decrypt(user.getTwoFactorSecret());
        if (secret == null || !totpService.verifyCode(secret, code)) {
            return null;
        }
        user.setTwoFactorEnabled(true);
        List<String> codes = generateAndStoreRecoveryCodes(user);
        userRepository.save(user);
        return codes;
    }

    /** Require a valid TOTP or recovery code before turning 2FA off, then wipe all 2FA material. */
    @Transactional
    public boolean disable(Long userId, String code) {
        allUsers user = getUser(userId);
        if (!user.isTwoFactorEnabled()) return true;
        if (!verifyUserCode(user, code)) {
            return false;
        }
        clear(user);
        userRepository.save(user);
        return true;
    }

    /** Admin override: clear a user's 2FA so they can re-enrol (lost-authenticator recovery). */
    @Transactional
    public boolean adminReset(Long userId) {
        allUsers user = getUser(userId);
        clear(user);
        userRepository.save(user);
        return true;
    }

    /** Regenerate recovery codes (verifying a current code first); returns the new codes once. */
    @Transactional
    public List<String> regenerateRecoveryCodes(Long userId, String code) {
        allUsers user = getUser(userId);
        if (!user.isTwoFactorEnabled() || !verifyUserCode(user, code)) {
            return null;
        }
        List<String> codes = generateAndStoreRecoveryCodes(user);
        userRepository.save(user);
        return codes;
    }

    /**
     * Verify a login code against the user's TOTP secret OR one of their recovery codes. A matched
     * recovery code is consumed (single use). Persists the user when a recovery code is consumed.
     */
    @Transactional
    public boolean verifyUserCode(allUsers user, String code) {
        if (user == null || code == null) return false;
        String secret = encryptionService.decrypt(user.getTwoFactorSecret());
        if (secret != null && totpService.verifyCode(secret, code)) {
            return true;
        }
        return consumeRecoveryCode(user, code);
    }

    // ── internals ────────────────────────────────────────────────────────────

    private void clear(allUsers user) {
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.setTwoFactorRecoveryCodes(null);
    }

    private List<String> generateAndStoreRecoveryCodes(allUsers user) {
        List<String> plain = new ArrayList<>();
        List<String> hashed = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String c = randomRecoveryCode();
            plain.add(c.substring(0, 4) + "-" + c.substring(4)); // display format e.g. ABCD-EF12
            hashed.add(passwordEncoder.encode(normalize(c)));
        }
        try {
            user.setTwoFactorRecoveryCodes(objectMapper.writeValueAsString(hashed));
        } catch (Exception e) {
            user.setTwoFactorRecoveryCodes(null);
        }
        return plain;
    }

    private boolean consumeRecoveryCode(allUsers user, String code) {
        String stored = user.getTwoFactorRecoveryCodes();
        if (stored == null || stored.isBlank()) return false;
        List<String> hashes;
        try {
            hashes = objectMapper.readValue(stored, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return false;
        }
        String candidate = normalize(code);
        for (int i = 0; i < hashes.size(); i++) {
            if (passwordEncoder.matches(candidate, hashes.get(i))) {
                hashes.remove(i); // single use
                try {
                    user.setTwoFactorRecoveryCodes(objectMapper.writeValueAsString(hashes));
                } catch (Exception ignore) { }
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }

    private String randomRecoveryCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(RC_ALPHABET.charAt(RANDOM.nextInt(RC_ALPHABET.length())));
        return sb.toString();
    }

    /** Normalise a recovery code for comparison: drop separators/spaces, uppercase. */
    private String normalize(String code) {
        return code == null ? "" : code.replaceAll("[\\s-]", "").toUpperCase();
    }

    private allUsers getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}
