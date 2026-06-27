package com.example.gpiApp;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.entity.SystemSettings;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.SystemSettingsRepository;
import com.example.gpiApp.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

/** Proves configuration (system settings) is isolated per organization — each org has its own row. */
@SpringBootTest
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class TenantSettingsIsolationTest {

    @Autowired SystemSettingsService settingsService;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired SystemSettingsRepository settingsRepository;

    @Test
    void settingsAreIsolatedPerTenant() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Organization org2 = organizationRepository.save(
                Organization.builder().name("ISO Settings Org " + tag).slug("setiso-" + tag).build());
        try {
            // Org 1 (default): ensure registration is ON
            TenantContext.setOrganizationId(1L);
            SystemSettings s1 = settingsService.getSettings();
            s1.setRegistrationEnabled(true);
            settingsRepository.save(s1);
            Long s1Id = s1.getId();

            // Org 2: getSettings() lazily creates a SEPARATE row, then we close its registration
            TenantContext.setOrganizationId(org2.getId());
            SystemSettings s2 = settingsService.getSettings();
            Long s2Id = s2.getId();
            s2.setRegistrationEnabled(false);
            settingsRepository.save(s2);

            boolean distinctRows = s1Id != null && !s1Id.equals(s2Id);

            // Re-read each org independently
            TenantContext.setOrganizationId(1L);
            boolean org1StillOpen = Boolean.TRUE.equals(settingsService.getSettings().getRegistrationEnabled());
            TenantContext.setOrganizationId(org2.getId());
            boolean org2Closed = Boolean.FALSE.equals(settingsService.getSettings().getRegistrationEnabled());

            System.out.println("ISOSET|distinct=" + distinctRows + " org1Open=" + org1StillOpen + " org2Closed=" + org2Closed);
            System.out.println("ISOSET|RESULT isolated=" + (distinctRows && org1StillOpen && org2Closed));
        } finally {
            TenantContext.clear();
            settingsRepository.findByOrganizationId(org2.getId()).ifPresent(settingsRepository::delete);
            organizationRepository.delete(org2);
        }
    }
}
