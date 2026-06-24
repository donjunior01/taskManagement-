package com.example.gpiApp.config.security;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * After a successful OIDC/SSO login, links the federated identity to a local account (provisioning
 * one on first sign-in), then issues our normal JWT + revocable session and redirects the browser
 * back to the SPA with the token. Only wired into the chain when SSO is configured (see SecurityConfig).
 */
@Component
@RequiredArgsConstructor
public class OidcLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtUtil jwtUtil;
    private final SessionService sessionService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.sso.redirect-uri:http://localhost:4200/auth/sso-callback}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        String email = extractEmail(authentication);
        if (email == null || email.isBlank()) {
            response.sendRedirect(redirectUri + "?error=no_email");
            return;
        }
        allUsers user = userRepository.findByEmail(email).orElseGet(() -> provision(email, authentication));
        if (!user.isActive()) {
            response.sendRedirect(redirectUri + "?error=inactive");
            return;
        }
        String sessionId = sessionService.createSession(user, request.getRemoteAddr(), request.getHeader("User-Agent"));
        String token = jwtUtil.generateToken(user, sessionId);
        response.sendRedirect(redirectUri + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
    }

    private String extractEmail(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            Object email = oauthUser.getAttributes().get("email");
            if (email != null) return email.toString();
            Object preferred = oauthUser.getAttributes().get("preferred_username");
            if (preferred != null && preferred.toString().contains("@")) return preferred.toString();
        }
        return null;
    }

    private allUsers provision(String email, Authentication authentication) {
        allUsers user = new allUsers();
        user.setEmail(email);
        String base = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        user.setUsername(uniqueUsername(base));
        String name = principalName(authentication, base);
        user.setFirstName(name);
        user.setLastName("");
        user.setRole(allUsers.Role.USER);
        user.setActive(true);
        user.setPassword(passwordEncoder.encode("SSO_" + UUID.randomUUID()));
        user.setPasswordChangedAt(java.time.LocalDateTime.now());
        organizationRepository.findById(1L).ifPresent(user::setOrganization);
        return userRepository.save(user);
    }

    private String principalName(Authentication authentication, String fallback) {
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            Object name = oauthUser.getAttributes().get("name");
            if (name != null) return name.toString();
            Object given = oauthUser.getAttributes().get("given_name");
            if (given != null) return given.toString();
        }
        return fallback;
    }

    private String uniqueUsername(String base) {
        String candidate = base;
        int i = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + i++;
        }
        return candidate;
    }
}
