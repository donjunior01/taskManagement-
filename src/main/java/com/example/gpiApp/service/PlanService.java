package com.example.gpiApp.service;

import com.example.gpiApp.billing.PlanCatalog;
import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.PlanInfoDTO;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/** Subscription plan info, limits and enforcement for the caller's organization. */
@Service
@RequiredArgsConstructor
public class PlanService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public PlanInfoDTO currentPlan() {
        Long orgId = TenantContext.getOrganizationId();
        Organization org = orgId != null ? organizationRepository.findById(orgId).orElse(null) : null;
        String planKey = org != null ? org.getPlan() : "ENTERPRISE";
        PlanCatalog.Plan plan = PlanCatalog.get(planKey);
        long users = orgId != null ? userRepository.countByOrganizationId(orgId) : 0;
        long projects = orgId != null ? projectRepository.countByOrganizationId(orgId) : 0;
        return PlanInfoDTO.builder()
                .organizationName(org != null ? org.getName() : "—")
                .plan(plan.key)
                .maxUsers(plan.maxUsers)
                .maxProjects(plan.maxProjects)
                .userCount(users)
                .projectCount(projects)
                .available(PlanCatalog.all().values().stream()
                        .map(p -> PlanInfoDTO.PlanOption.builder().key(p.key).maxUsers(p.maxUsers).maxProjects(p.maxProjects).build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void changePlan(String planKey) {
        if (!PlanCatalog.isValid(planKey)) throw new AccessDeniedException("Unknown plan: " + planKey);
        Long orgId = TenantContext.getOrganizationId();
        if (orgId == null) return;
        organizationRepository.findById(orgId).ifPresent(org -> {
            org.setPlan(planKey.toUpperCase());
            organizationRepository.save(org);
        });
    }

    /** Whether the given tenant can still add a user under its plan's seat limit. */
    @Transactional(readOnly = true)
    public boolean canAddUser(Long orgId) {
        if (orgId == null) return true;
        Organization org = organizationRepository.findById(orgId).orElse(null);
        PlanCatalog.Plan plan = PlanCatalog.get(org != null ? org.getPlan() : "ENTERPRISE");
        return PlanCatalog.withinLimit((int) userRepository.countByOrganizationId(orgId), plan.maxUsers);
    }
}
