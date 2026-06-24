package com.example.gpiApp.config;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.TenantOwned;
import jakarta.persistence.PrePersist;

/**
 * JPA listener that stamps every new tenant-owned record with the current request's organization id,
 * so application code never has to remember to set it. Existing rows are backfilled in schema.sql.
 */
public class TenantListener {

    @PrePersist
    public void setTenantOnCreate(Object entity) {
        if (entity instanceof TenantOwned) {
            TenantOwned t = (TenantOwned) entity;
            if (t.getOrganizationId() == null) {
                t.setOrganizationId(TenantContext.getOrganizationId());
            }
        }
    }
}
