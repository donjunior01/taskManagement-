package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A tenant's subscription to outbound event notifications. When a subscribed event fires, the app
 * POSTs a JSON payload to {@code url}, signed with HMAC-SHA256 using {@code secret} (sent in the
 * X-Webhook-Signature header) so the receiver can verify authenticity.
 */
@Data
@Entity
@Table(name = "webhook_subscriptions")
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "organization_id = :orgId")
@EntityListeners(com.example.gpiApp.config.TenantListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookSubscription implements TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false, length = 500)
    private String url;

    /** Shared secret used to HMAC-sign payloads. */
    @Column(name = "secret", length = 120)
    private String secret;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "webhook_events", joinColumns = @JoinColumn(name = "subscription_id"))
    @Column(name = "event", length = 80)
    @Builder.Default
    private Set<String> events = new HashSet<>();

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_status")
    private Integer lastStatus;

    @Column(name = "last_delivery_at")
    private LocalDateTime lastDeliveryAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
