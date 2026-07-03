package com.example.gpiApp;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.CustomFieldDefinition;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.entity.SystemSettings;
import com.example.gpiApp.repository.CustomFieldDefinitionRepository;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.SystemSettingsRepository;
import com.example.gpiApp.service.CustomFieldService;
import com.example.gpiApp.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

/**
 * Proves isolation holds for a repo/@Filter-scoped config entity (custom fields) AND for the
 * per-organization SystemSettings — i.e. even "configuration" data never crosses tenants.
 */
@SpringBootTest
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class TenantConfigIsolationTest {

    @Autowired CustomFieldService customFieldService;
    @Autowired CustomFieldDefinitionRepository customFieldRepository;
    @Autowired SystemSettingsService settingsService;
    @Autowired SystemSettingsRepository settingsRepository;
    @Autowired OrganizationRepository organizationRepository;

    @Test
    void customFieldsAndSettingsAreIsolatedPerTenant() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Organization orgA = organizationRepository.save(Organization.builder().name("Cfg A " + tag).slug("cfga-" + tag).build());
        Organization orgB = organizationRepository.save(Organization.builder().name("Cfg B " + tag).slug("cfgb-" + tag).build());
        Long a = orgA.getId(), b = orgB.getId();
        boolean cfOk = false, cfgOk = false;
        try {
            // ── Custom fields (config entity) ──
            TenantContext.setOrganizationId(a);
            customFieldService.create(CustomFieldDefinition.builder().name("CF-A-" + tag).fieldType(CustomFieldDefinition.FieldType.TEXT).build());
            TenantContext.setOrganizationId(b);
            customFieldService.create(CustomFieldDefinition.builder().name("CF-B-" + tag).fieldType(CustomFieldDefinition.FieldType.TEXT).build());

            TenantContext.setOrganizationId(a);
            List<String> asA = customFieldService.list(false).stream().map(CustomFieldDefinition::getName).toList();
            TenantContext.setOrganizationId(b);
            List<String> asB = customFieldService.list(false).stream().map(CustomFieldDefinition::getName).toList();
            cfOk = asA.contains("CF-A-" + tag) && !asA.contains("CF-B-" + tag)
                    && asB.contains("CF-B-" + tag) && !asB.contains("CF-A-" + tag);
            System.out.println("CFGISO|customFields A=" + asA + " B=" + asB + " isolated=" + cfOk);

            // ── Per-organization SystemSettings ──
            TenantContext.setOrganizationId(a);
            SystemSettings sA = settingsService.getSettings();     // find-or-create org A's row
            sA.setAppName("AppName-A-" + tag);
            settingsRepository.save(sA);
            TenantContext.setOrganizationId(b);
            SystemSettings sB = settingsService.getSettings();     // must be a DIFFERENT row (default name)
            String bName = sB.getAppName();
            TenantContext.setOrganizationId(a);
            String aName = settingsService.getSettings().getAppName();  // must still be A's value
            cfgOk = ("AppName-A-" + tag).equals(aName) && !("AppName-A-" + tag).equals(bName)
                    && !sA.getId().equals(sB.getId());
            System.out.println("CFGISO|settings A.name=" + aName + " B.name=" + bName + " isolated=" + cfgOk);

            System.out.println("CFGISO|RESULT isolated=" + (cfOk && cfgOk));
        } finally {
            TenantContext.clear();
            customFieldRepository.findByOrganizationIdOrderByDisplayOrderAscIdAsc(a).forEach(customFieldRepository::delete);
            customFieldRepository.findByOrganizationIdOrderByDisplayOrderAscIdAsc(b).forEach(customFieldRepository::delete);
            settingsRepository.findByOrganizationId(a).ifPresent(settingsRepository::delete);
            settingsRepository.findByOrganizationId(b).ifPresent(settingsRepository::delete);
            organizationRepository.delete(orgA);
            organizationRepository.delete(orgB);
        }
        org.junit.jupiter.api.Assertions.assertTrue(cfOk, "custom fields leaked across tenants");
        org.junit.jupiter.api.Assertions.assertTrue(cfgOk, "system settings leaked across tenants");
    }
}
