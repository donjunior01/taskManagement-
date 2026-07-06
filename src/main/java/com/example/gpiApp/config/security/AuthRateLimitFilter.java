package com.example.gpiApp.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Per-IP fixed-window rate limiter for the sensitive auth endpoints (login / register / password
 * reset). This is a second layer in front of the per-account login lockout — it blunts brute-force
 * and credential-stuffing from a single source before the request even reaches authentication.
 * Returns HTTP 429 with a Retry-After header when the window budget is exceeded.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final int limit;
    private final long windowMs;
    private final Map<String, Window> counters = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(
            @Value("${app.security.auth-rate-limit:60}") int limit,
            @Value("${app.security.auth-rate-window-ms:60000}") long windowMs) {
        this.limit = limit;
        this.windowMs = windowMs;
    }

    private static final class Window {
        volatile long start;
        final AtomicInteger count = new AtomicInteger(0);
        Window(long start) { this.start = start; }
    }

    /** Only guard the auth endpoints; everything else passes through untouched. */
    private boolean isRateLimited(HttpServletRequest req) {
        String p = req.getRequestURI();
        return p.startsWith("/api/auth/login")
                || p.startsWith("/api/auth/register")
                || p.startsWith("/api/auth/password-reset");
    }

    private String clientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (!isRateLimited(req)) {
            chain.doFilter(req, res);
            return;
        }
        String key = clientIp(req) + '|' + req.getRequestURI();
        long now = System.currentTimeMillis();
        Window w = counters.computeIfAbsent(key, k -> new Window(now));
        boolean blocked;
        synchronized (w) {
            if (now - w.start >= windowMs) {        // window elapsed → reset
                w.start = now;
                w.count.set(0);
            }
            blocked = w.count.incrementAndGet() > limit;
        }
        if (blocked) {
            res.setStatus(429);                     // Too Many Requests
            res.setHeader("Retry-After", String.valueOf(windowMs / 1000));
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"message\":\"Too many attempts. Please wait and try again.\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
