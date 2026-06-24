package com.example.gpiApp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Symmetric encryption (AES-256-GCM) for small secrets stored at rest — currently the per-user TOTP
 * secret. Ciphertext is tagged with an "enc:" prefix so legacy plaintext values are detected and
 * passed through unchanged (transparent migration: they get encrypted the next time they're written).
 *
 * The key derives from {@code app.encryption.secret}; set a strong value via env in production.
 */
@Service
public class EncryptionService {

    private static final String PREFIX = "enc:";
    private static final int IV_LENGTH = 12;       // GCM nonce
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public EncryptionService(@Value("${app.encryption.secret:change-me-please-32-byte-min-secret}") String secret) {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));
            this.key = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialise encryption key", e);
        }
    }

    /** Encrypt a value (no-op for null/blank). Output is prefixed so we can recognise it later. */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) return plaintext;
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return PREFIX + Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Encryption failed", e);
        }
    }

    /** Decrypt a value produced by {@link #encrypt}; legacy plaintext (no prefix) is returned as-is. */
    public String decrypt(String stored) {
        if (stored == null || !stored.startsWith(PREFIX)) return stored; // legacy plaintext / null
        try {
            byte[] data = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(data, 0, iv, 0, IV_LENGTH);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] pt = cipher.doFinal(data, IV_LENGTH, data.length - IV_LENGTH);
            return new String(pt, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Decryption failed", e);
        }
    }
}
