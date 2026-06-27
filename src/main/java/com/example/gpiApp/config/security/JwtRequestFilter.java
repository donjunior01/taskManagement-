package com.example.gpiApp.config.security;

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

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.example.gpiApp.service.SessionService sessionService;

    @Autowired
    private com.example.gpiApp.repository.UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception ex) {
                logger.warn("Could not extract username from JWT (token may be expired or invalid)");
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                // Revocable sessions: a token carrying a jti must map to an active (non-revoked) session.
                // Legacy tokens issued before this feature carry no jti and are still accepted until they expire.
                String sessionId = jwtUtil.extractSessionId(jwt);
                boolean sessionOk = sessionId == null || sessionService.isActiveAndTouch(sessionId);

                if (sessionOk && jwtUtil.validateToken(jwt, userDetails) && userDetails.isEnabled()) {
                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    usernamePasswordAuthenticationToken
                            .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);

                    // Establish the tenant for this request (used by the data layer to scope queries).
                    // The principal is a userdetails.User (username = email), not the entity, so resolve
                    // the user's organization by email rather than casting the principal.
                    userRepository.findByEmail(username).ifPresent(u -> {
                        if (u.getOrganization() != null) {
                            TenantContext.setOrganizationId(u.getOrganization().getId());
                        }
                    });
                }
            } catch (Exception ex) {
                logger.warn("JWT request filter failed to authenticate stale or invalid user subject: " + username, ex);
            }
        }
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
} 