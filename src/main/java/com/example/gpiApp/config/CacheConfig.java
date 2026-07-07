package com.example.gpiApp.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * In-process caching (Caffeine). Used for hot, rarely-changing public reads (branding, password
 * policy) so they don't hit the database on every login/registration page load. Entries expire after
 * a few minutes and are also evicted explicitly when settings change (see SystemSettingsService).
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String BRANDING = "branding";
    public static final String PASSWORD_POLICY = "passwordPolicy";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(BRANDING, PASSWORD_POLICY);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(1_000));
        return manager;
    }
}
