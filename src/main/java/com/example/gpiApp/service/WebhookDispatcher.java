package com.example.gpiApp.service;

import com.example.gpiApp.entity.WebhookSubscription;
import com.example.gpiApp.repository.WebhookSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Delivers webhook payloads off the request thread. Runs in its own bean so the @Async proxy applies.
 * Each active subscription to the event receives the signed body; failures are retried briefly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebhookDispatcher {

    private final WebhookSubscriptionRepository subscriptionRepository;
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Async
    @Transactional
    public void deliver(Long organizationId, String event, String jsonBody) {
        if (organizationId == null) return;
        List<WebhookSubscription> subs = subscriptionRepository.findByOrganizationIdAndActiveTrue(organizationId);
        for (WebhookSubscription sub : subs) {
            if (sub.getEvents() == null || !sub.getEvents().contains(event)) continue;
            int status = post(sub, jsonBody);
            sub.setLastStatus(status);
            sub.setLastDeliveryAt(LocalDateTime.now());
            subscriptionRepository.save(sub);
        }
    }

    /** Deliver a one-off test payload to a single subscription (ignores event filtering). */
    @Async
    @Transactional
    public void testDeliver(Long subscriptionId, String jsonBody) {
        subscriptionRepository.findById(subscriptionId).ifPresent(sub -> {
            sub.setLastStatus(post(sub, jsonBody));
            sub.setLastDeliveryAt(LocalDateTime.now());
            subscriptionRepository.save(sub);
        });
    }

    /** POST with one quick retry; returns the HTTP status (or -1 on transport failure). */
    private int post(WebhookSubscription sub, String body) {
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                HttpRequest.Builder req = HttpRequest.newBuilder()
                        .uri(URI.create(sub.getUrl()))
                        .timeout(Duration.ofSeconds(8))
                        .header("Content-Type", "application/json")
                        .header("X-Webhook-Event", "delivery")
                        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
                if (sub.getSecret() != null && !sub.getSecret().isBlank()) {
                    req.header("X-Webhook-Signature", "sha256=" + hmacSha256(sub.getSecret(), body));
                }
                HttpResponse<String> resp = HTTP.send(req.build(), HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() < 500) return resp.statusCode(); // 2xx/3xx/4xx are final
            } catch (Exception e) {
                log.warn("Webhook delivery to {} failed (attempt {}): {}", sub.getUrl(), attempt + 1, e.getMessage());
            }
            try { Thread.sleep(500); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        }
        return -1;
    }

    static String hmacSha256(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : raw) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
