package com.example.gpiApp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Tells the login page whether SSO is available so it can show the "Sign in with SSO" button.
 * Public (under /api/auth/**). Reports enabled only when the flag is on AND a provider is configured.
 */
@RestController
@RequestMapping("/api/auth")
public class SsoController {

    private final boolean configured;
    private final com.example.gpiApp.repository.UserRepository userRepository;

    @Value("${app.sso.enabled:false}")
    private boolean ssoEnabled;

    public SsoController(org.springframework.beans.factory.ObjectProvider<ClientRegistrationRepository> repoProvider,
                         com.example.gpiApp.repository.UserRepository userRepository) {
        this.configured = repoProvider.getIfAvailable() != null;
        this.userRepository = userRepository;
    }

    @GetMapping("/sso-status")
    public Map<String, Object> status() {
        boolean enabled = ssoEnabled && configured;
        // "oidc" is the expected registration id; the authorize URL the SPA links to when enabled.
        return Map.of("enabled", enabled, "loginUrl", "/oauth2/authorization/oidc");
    }

    /** Current authenticated user — used by the SSO callback to hydrate the SPA session from the token. */
    @GetMapping("/me")
    public org.springframework.http.ResponseEntity<Map<String, Object>> me(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return org.springframework.http.ResponseEntity.status(401).build();
        }
        // Principal is a userdetails.User (username = email); resolve the entity by email.
        com.example.gpiApp.entity.allUsers user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return org.springframework.http.ResponseEntity.status(401).build();
        java.util.List<String> roles = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .collect(java.util.stream.Collectors.toList());
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("id", user.getId());
        body.put("email", user.getEmail());
        body.put("roles", roles);
        return org.springframework.http.ResponseEntity.ok(body);
    }
}
