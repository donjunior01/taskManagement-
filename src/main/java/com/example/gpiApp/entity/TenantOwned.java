package com.example.gpiApp.entity;

/**
 * Marker for tenant-scoped entities: they carry an organization_id that is auto-stamped on insert
 * (from the current request's tenant) and used to isolate one organization's data from another.
 */
public interface TenantOwned {
    Long getOrganizationId();
    void setOrganizationId(Long organizationId);
}
