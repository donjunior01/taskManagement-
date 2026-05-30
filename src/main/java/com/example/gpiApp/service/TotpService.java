package com.example.gpiApp.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Time-based One-Time Password (TOTP, RFC 6238) generator/verifier — compatible with
 * Google Authenticator, Authy, etc. Implemented with the JDK only (HMAC-SHA1 + Base32),
 * so no extra dependency is required.
 */
@Service
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;   // 160-bit secret
    private static final int DIGITS = 6;
    private static final int PERIOD_SECONDS = 30;
    private static final int WINDOW = 1;          // accept +/- 1 step for clock skew

    private final SecureRandom random = new SecureRandom();

    /** Generate a fresh Base32-encoded secret for a new enrolment. */
    public String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        random.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /** Build the otpauth:// provisioning URI an authenticator app scans (or imports manually). */
    public String buildOtpAuthUri(String secret, String accountName, String issuer) {
        String label = enc(issuer) + ":" + enc(accountName);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + enc(issuer)
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + PERIOD_SECONDS;
    }

    /** Verify a user-supplied code against the secret, allowing a small time window. */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) return false;
        String trimmed = code.trim().replace(" ", "");
        if (!trimmed.matches("\\d{" + DIGITS + "}")) return false;
        byte[] key;
        try {
            key = base32Decode(secret);
        } catch (Exception e) {
            return false;
        }
        long currentStep = System.currentTimeMillis() / 1000L / PERIOD_SECONDS;
        for (int offset = -WINDOW; offset <= WINDOW; offset++) {
            if (trimmed.equals(generateCode(key, currentStep + offset))) {
                return true;
            }
        }
        return false;
    }

    // ── Core TOTP ──────────────────────────────────────────────────────────────

    private String generateCode(byte[] key, long step) {
        byte[] data = ByteBuffer.allocate(8).putLong(step).array();
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate TOTP", e);
        }
    }

    // ── Base32 (RFC 4648, no padding) ────────────────────────────────────────────

    private String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                sb.append(BASE32_ALPHABET.charAt(index));
            }
        }
        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            sb.append(BASE32_ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    private byte[] base32Decode(String s) {
        String clean = s.trim().replace("=", "").replace(" ", "").toUpperCase();
        int buffer = 0, bitsLeft = 0, count = 0;
        byte[] out = new byte[clean.length() * 5 / 8];
        for (char c : clean.toCharArray()) {
            int val = BASE32_ALPHABET.indexOf(c);
            if (val < 0) throw new IllegalArgumentException("Invalid Base32 character: " + c);
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[count++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return out;
    }

    private String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }
}
