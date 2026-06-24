package com.example.gpiApp.config.security;

/**
 * Holds the current request's tenant (organization) id in a ThreadLocal so the data layer can scope
 * queries to the caller's organization. Set by the JWT filter after authentication and cleared at the
 * end of the request. Phase 1 only populates it; enforcement (Hibernate tenant filter) comes later.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_ORG = new ThreadLocal<>();

    private TenantContext() {}

    public static void setOrganizationId(Long orgId) {
        CURRENT_ORG.set(orgId);
    }

    public static Long getOrganizationId() {
        return CURRENT_ORG.get();
    }

    public static void clear() {
        CURRENT_ORG.remove();
    }
}
