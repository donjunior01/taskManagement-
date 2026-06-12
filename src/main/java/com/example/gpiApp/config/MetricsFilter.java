package com.example.gpiApp.config;

import com.example.gpiApp.service.MetricsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Times every API request and reports latency + status to {@link MetricsService},
 * so the admin performance page reads real throughput, latency and error metrics.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class MetricsFilter extends OncePerRequestFilter {

    private final MetricsService metricsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            String uri = request.getRequestURI();
            // Only track API traffic; ignore static assets and docs.
            if (uri != null && uri.startsWith("/api/")) {
                long ms = (System.nanoTime() - start) / 1_000_000;
                metricsService.record(request.getMethod(), uri, response.getStatus(), ms);
            }
        }
    }
}
