package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.ApiKeyDTO;
import com.example.gpiApp.entity.ApiKey;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/** Issues, verifies and revokes API keys. Only the SHA-256 hash is persisted. */
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final SecureRandom RNG = new SecureRandom();
    private final ApiKeyRepository apiKeyRepository;

    /** Create a key for the given creator and return the DTO INCLUDING the one-time plaintext. */
    @Transactional
    public ApiKeyDTO create(String name, allUsers creator) {
        String raw = "gpi_live_" + randomHex(32);
        String prefix = raw.substring(0, Math.min(raw.length(), 16)) + "…";
        ApiKey key = ApiKey.builder()
                .name(name != null && !name.isBlank() ? name : "API key")
                .keyHash(sha256Hex(raw))
                .keyPrefix(prefix)
                .createdBy(creator)
                .build();
        ApiKey saved = apiKeyRepository.save(key);   // TenantListener stamps the organization
        ApiKeyDTO dto = toDTO(saved);
        dto.setPlaintextKey(raw);                    // shown exactly once
        return dto;
    }

    /** Resolve an active key by its plaintext, touching last-used. Returns empty if missing/revoked. */
    @Transactional
    public Optional<ApiKey> resolveActive(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) return Optional.empty();
        return apiKeyRepository.findByKeyHash(sha256Hex(rawKey.trim())).map(k -> {
            if (k.isRevoked()) return null;
            LocalDateTime now = LocalDateTime.now();
            if (k.getLastUsedAt() == null || k.getLastUsedAt().isBefore(now.minusMinutes(1))) {
                k.setLastUsedAt(now);
                apiKeyRepository.save(k);
            }
            return k;
        });
    }

    /** Username of the creator of an active key (resolved inside the tx so lazy fields load safely). */
    @Transactional
    public Optional<String> resolveActiveUsername(String rawKey) {
        return resolveActive(rawKey).map(k -> k.getCreatedBy() != null ? k.getCreatedBy().getUsername() : null);
    }

    @Transactional(readOnly = true)
    public List<ApiKeyDTO> listForCurrentTenant() {
        Long org = TenantContext.getOrganizationId();
        List<ApiKey> keys = org != null ? apiKeyRepository.findByOrganizationIdOrderByCreatedAtDesc(org) : apiKeyRepository.findAll();
        return keys.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public void revoke(Long id) {
        ApiKey key = apiKeyRepository.findById(id).orElseThrow(() -> new AccessDeniedException("API key not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && key.getOrganizationId() != null && !org.equals(key.getOrganizationId())) {
            throw new AccessDeniedException("This API key belongs to another organization.");
        }
        key.setRevoked(true);
        key.setRevokedAt(LocalDateTime.now());
        apiKeyRepository.save(key);
    }

    private ApiKeyDTO toDTO(ApiKey k) {
        String creator = null;
        try {
            if (k.getCreatedBy() != null) creator = (k.getCreatedBy().getFirstName() + " " + k.getCreatedBy().getLastName()).trim();
        } catch (Exception ignore) { }
        return ApiKeyDTO.builder()
                .id(k.getId()).name(k.getName()).keyPrefix(k.getKeyPrefix())
                .createdByName(creator).createdAt(k.getCreatedAt()).lastUsedAt(k.getLastUsedAt())
                .revoked(k.isRevoked()).build();
    }

    private static String randomHex(int bytes) {
        byte[] b = new byte[bytes];
        RNG.nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }

    public static String sha256Hex(String input) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
