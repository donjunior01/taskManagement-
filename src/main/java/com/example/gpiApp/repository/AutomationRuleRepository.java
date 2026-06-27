package com.example.gpiApp.repository;

import com.example.gpiApp.entity.AutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AutomationRuleRepository extends JpaRepository<AutomationRule, Long> {
    List<AutomationRule> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<AutomationRule> findByOrganizationIdAndTriggerAndEnabledTrue(Long organizationId, String trigger);
}
