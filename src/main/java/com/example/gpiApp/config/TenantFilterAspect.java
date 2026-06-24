package com.example.gpiApp.config;

import com.example.gpiApp.config.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Enables the Hibernate "tenantFilter" on the active session so reads are scoped to the current
 * organization. DISABLED BY DEFAULT ({@code app.multitenancy.enforce=false}) — shipping it off means
 * the running app is unchanged. It must only be switched on in an environment where a multi-org
 * isolation test has been run, because enforcement bugs risk cross-tenant data exposure.
 *
 * <p>Note: with {@code spring.jpa.open-in-view=false} this reliably scopes @Transactional service
 * methods; broader coverage (non-transactional paths, native queries) needs runtime verification.
 */
@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.multitenancy.enforce:false}")
    private boolean enforce;

    @Before("execution(* com.example.gpiApp.service..*(..))")
    public void enableTenantFilter() {
        if (!enforce) return;
        Long orgId = TenantContext.getOrganizationId();
        if (orgId == null) return;
        try {
            Session session = entityManager.unwrap(Session.class);
            if (session.getEnabledFilter("tenantFilter") == null) {
                session.enableFilter("tenantFilter").setParameter("orgId", orgId);
            }
        } catch (Exception ignore) {
            // No active session / any issue → leave unfiltered (fail-safe to current behaviour).
        }
    }
}
