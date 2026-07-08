package com.example.gpiApp.repository;

import com.example.gpiApp.entity.AutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AutomationRuleRepository extends JpaRepository<AutomationRule, Long> {
    List<AutomationRule> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<AutomationRule> findByOrganizationIdAndTriggerAndEnabledTrue(Long organizationId, String trigger);

    /** Orgs that have at least one enabled rule for a given trigger — lets the scheduler skip idle tenants. */
    @Query("SELECT DISTINCT r.organizationId FROM AutomationRule r WHERE r.trigger = :trigger AND r.enabled = true")
    List<Long> findOrgIdsWithEnabledTrigger(@Param("trigger") String trigger);
}
