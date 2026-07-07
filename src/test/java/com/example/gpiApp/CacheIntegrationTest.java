package com.example.gpiApp;

import com.example.gpiApp.config.CacheConfig;
import com.example.gpiApp.repository.SystemSettingsRepository;
import com.example.gpiApp.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.cache.CacheManager;

import java.util.Objects;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/** Verifies the hot public reads are actually served from the Caffeine cache on repeat calls. */
@SpringBootTest
class CacheIntegrationTest {

    @Autowired SystemSettingsService service;
    @Autowired CacheManager cacheManager;
    @SpyBean SystemSettingsRepository repository;

    @Test
    void brandingReadIsCachedAcrossCalls() {
        Objects.requireNonNull(cacheManager.getCache(CacheConfig.BRANDING)).clear();
        Mockito.clearInvocations(repository);

        service.getBranding();   // miss → hits the repository
        service.getBranding();   // hit  → served from cache, no repository call

        verify(repository, times(1)).findByOrganizationId(any());
    }
}
