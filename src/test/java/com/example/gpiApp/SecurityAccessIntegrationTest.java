package com.example.gpiApp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end security tests over the real chain (JWT filter → TenantContext → @perm.has / role guards),
 * using the seeded MTN accounts (password "password123"). Requires the DB seed (data.sql).
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class SecurityAccessIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired com.example.gpiApp.repository.SystemSettingsRepository settingsRepository;

    private static final String ADMIN = "admin@mtncameroon.cm";
    private static final String USER = "mbarga@mtncameroon.cm";

    /** Ensure org 1's login gates are open so the seeded non-admin can sign in (the DB is reused,
     *  and maintenance mode / a domain restriction would otherwise 403 every non-admin login). */
    @org.junit.jupiter.api.BeforeEach
    void openLoginGates() {
        settingsRepository.findByOrganizationId(1L).ifPresent(s -> {
            s.setMaintenanceMode(false);
            s.setRegistrationEnabled(true);
            s.setAllowedEmailDomains("");
            settingsRepository.save(s);
        });
    }

    private String bearer(String email) throws Exception {
        String body = om.writeValueAsString(Map.of("email", email, "password", "password123"));
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        String token = om.readTree(r.getResponse().getContentAsString()).path("token").asText();
        return "Bearer " + token;
    }

    @Test
    void publicRegistrationPolicyNeedsNoAuth() throws Exception {
        mvc.perform(get("/api/settings/registration")).andExpect(status().isOk());
    }

    @Test
    void protectedEndpointBlocksAnonymous() throws Exception {
        mvc.perform(get("/api/custom-fields")).andExpect(status().is4xxClientError());
    }

    @Test
    void userWithoutPermissionIsForbidden() throws Exception {
        // A plain USER lacks customfield.manage → the @perm.has guard must deny.
        mvc.perform(get("/api/custom-fields/all").header("Authorization", bearer(USER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminWithPermissionIsAllowed() throws Exception {
        mvc.perform(get("/api/custom-fields/all").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk());
    }

    @Test
    void anyAuthenticatedUserCanReadTheirActiveCustomFields() throws Exception {
        mvc.perform(get("/api/custom-fields").header("Authorization", bearer(USER)))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotUpdateSecuritySettings() throws Exception {
        // PUT /api/settings/security is hasAuthority('ROLE_ADMIN').
        mvc.perform(put("/api/settings/security").header("Authorization", bearer(USER))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReadSettings() throws Exception {
        mvc.perform(get("/api/settings").header("Authorization", bearer(ADMIN)))
                .andExpect(status().isOk());
    }
}
