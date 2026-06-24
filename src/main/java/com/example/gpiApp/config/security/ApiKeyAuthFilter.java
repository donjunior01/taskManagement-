package com.example.gpiApp.config.security;

import com.example.gpiApp.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authenticates requests presenting a valid {@code X-API-Key} header, as the key's creator (so the
 * call inherits that user's organization + permissions). Fail-safe: it acts only when a key is
 * present and no other authentication exists, and never interferes with the JWT flow.
 */
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    @Autowired
    private ApiKeyService apiKeyService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String apiKey = request.getHeader("X-API-Key");
        if (apiKey != null && !apiKey.isBlank()
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                apiKeyService.resolveActiveUsername(apiKey).ifPresent(username -> {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (userDetails.isEnabled()) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        if (userDetails instanceof com.example.gpiApp.entity.allUsers) {
                            com.example.gpiApp.entity.Organization org = ((com.example.gpiApp.entity.allUsers) userDetails).getOrganization();
                            if (org != null) TenantContext.setOrganizationId(org.getId());
                        }
                    }
                });
            } catch (Exception ignore) {
                // Any failure → leave the request unauthenticated (protected endpoints then return 401/403).
            }
        }
        chain.doFilter(request, response);
    }
}
