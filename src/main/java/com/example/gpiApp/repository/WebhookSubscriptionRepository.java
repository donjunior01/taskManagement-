package com.example.gpiApp.repository;

import com.example.gpiApp.entity.WebhookSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WebhookSubscriptionRepository extends JpaRepository<WebhookSubscription, Long> {
    List<WebhookSubscription> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<WebhookSubscription> findByOrganizationIdAndActiveTrue(Long organizationId);
}
