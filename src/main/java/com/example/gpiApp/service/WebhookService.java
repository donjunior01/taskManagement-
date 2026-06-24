package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.WebhookDTO;
import com.example.gpiApp.entity.WebhookSubscription;
import com.example.gpiApp.repository.WebhookSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages webhook subscriptions and is the entry point domain services call to emit events. The
 * actual HTTP delivery is handed to {@link WebhookDispatcher} (async, off the request thread).
 */
@Service
@RequiredArgsConstructor
public class WebhookService {

    /** Catalog of emittable events (shown in the subscription UI). */
    public static final List<String> EVENT_CATALOG = List.of(
            "task.created", "task.updated", "task.completed",
            "project.created", "project.updated",
            "deliverable.submitted", "deliverable.reviewed",
            "member.assigned");

    private final WebhookSubscriptionRepository subscriptionRepository;
    private final WebhookDispatcher dispatcher;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public List<String> catalog() { return EVENT_CATALOG; }

    /**
     * Emit an event for the current tenant. Reads the tenant id synchronously (the async dispatcher
     * runs on another thread where the request-scoped tenant context is not available) and never
     * throws into the caller — webhook delivery must not break the business operation.
     */
    public void emit(String event, Map<String, Object> payload) {
        try {
            Long org = TenantContext.getOrganizationId();
            if (org == null) return;
            Map<String, Object> envelope = Map.of(
                    "event", event,
                    "organizationId", org,
                    "timestamp", LocalDateTime.now().toString(),
                    "data", payload != null ? payload : Map.of());
            String json = MAPPER.writeValueAsString(envelope);
            dispatcher.deliver(org, event, json);
        } catch (Exception ignore) { /* delivery is best-effort */ }
    }

    @Transactional(readOnly = true)
    public List<WebhookDTO> listForCurrentTenant() {
        Long org = TenantContext.getOrganizationId();
        List<WebhookSubscription> subs = org != null
                ? subscriptionRepository.findByOrganizationIdOrderByCreatedAtDesc(org)
                : subscriptionRepository.findAll();
        return subs.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public WebhookDTO create(WebhookDTO dto) {
        WebhookSubscription sub = WebhookSubscription.builder()
                .url(dto.getUrl())
                .secret(dto.getSecret() != null && !dto.getSecret().isBlank()
                        ? dto.getSecret() : "whsec_" + UUID.randomUUID().toString().replace("-", ""))
                .events(sanitize(dto.getEvents()))
                .active(true)
                .build();
        return toDTO(subscriptionRepository.save(sub));   // TenantListener stamps the organization
    }

    @Transactional
    public WebhookDTO update(Long id, WebhookDTO dto) {
        WebhookSubscription sub = getOwned(id);
        if (dto.getUrl() != null) sub.setUrl(dto.getUrl());
        if (dto.getEvents() != null) sub.setEvents(sanitize(dto.getEvents()));
        sub.setActive(dto.isActive());
        return toDTO(subscriptionRepository.save(sub));
    }

    @Transactional
    public void delete(Long id) { subscriptionRepository.delete(getOwned(id)); }

    /** Send a sample payload to one subscription so the integrator can verify the endpoint. */
    @Transactional
    public void test(Long id) {
        WebhookSubscription sub = getOwned(id);
        try {
            String json = MAPPER.writeValueAsString(Map.of(
                    "event", "ping", "organizationId", sub.getOrganizationId() != null ? sub.getOrganizationId() : 0,
                    "timestamp", LocalDateTime.now().toString(), "data", Map.of("message", "Test delivery")));
            dispatcher.testDeliver(sub.getId(), json);
        } catch (Exception ignore) { }
    }

    private WebhookSubscription getOwned(Long id) {
        WebhookSubscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Webhook not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && sub.getOrganizationId() != null && !org.equals(sub.getOrganizationId())) {
            throw new AccessDeniedException("This webhook belongs to another organization.");
        }
        return sub;
    }

    private Set<String> sanitize(Set<String> events) {
        if (events == null) return new HashSet<>();
        return events.stream().filter(EVENT_CATALOG::contains).collect(Collectors.toCollection(HashSet::new));
    }

    private WebhookDTO toDTO(WebhookSubscription s) {
        return WebhookDTO.builder()
                .id(s.getId()).url(s.getUrl()).secret(s.getSecret())
                .events(s.getEvents() != null ? new HashSet<>(s.getEvents()) : new HashSet<>())
                .active(s.isActive()).lastStatus(s.getLastStatus()).lastDeliveryAt(s.getLastDeliveryAt())
                .createdAt(s.getCreatedAt()).build();
    }
}
