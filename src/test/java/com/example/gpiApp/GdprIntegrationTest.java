package com.example.gpiApp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.SystemSettingsRepository;
import com.example.gpiApp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Integration tests for the GDPR export (right of access) and erasure (right to be forgotten). */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class GdprIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository userRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired SystemSettingsRepository settingsRepository;
    @Autowired PasswordEncoder encoder;

    private static final String ADMIN = "admin@mtncameroon.cm";
    private static final String USER = "mbarga@mtncameroon.cm";

    @BeforeEach
    void openLoginGates() {
        settingsRepository.findByOrganizationId(1L).ifPresent(s -> {
            s.setMaintenanceMode(false);
            s.setAllowedEmailDomains("");
            settingsRepository.save(s);
        });
    }

    private String bearer(String email) throws Exception {
        String body = om.writeValueAsString(Map.of("email", email, "password", "password123"));
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + om.readTree(r.getResponse().getContentAsString()).path("token").asText();
    }

    @Test
    void userCanExportTheirOwnData() throws Exception {
        MvcResult r = mvc.perform(get("/api/gdpr/export").header("Authorization", bearer(USER)))
                .andExpect(status().isOk()).andReturn();
        JsonNode json = om.readTree(r.getResponse().getContentAsString());
        assertThat(json.path("profile").path("email").asText()).isEqualTo(USER);
        assertThat(json.has("tasksAssigned")).isTrue();
    }

    @Test
    void nonAdminCannotEraseAUser() throws Exception {
        mvc.perform(post("/api/gdpr/erase/999999").header("Authorization", bearer(USER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanEraseAndPiiIsRemoved() throws Exception {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        allUsers tmp = new allUsers();
        tmp.setUsername("gdpr_tmp_" + tag);
        tmp.setEmail("gdprtmp_" + tag + "@mtncameroon.cm");
        tmp.setPassword(encoder.encode("password123"));
        tmp.setFirstName("Temp");
        tmp.setLastName("User");
        tmp.setRole(allUsers.Role.USER);
        tmp.setActive(true);
        organizationRepository.findById(1L).ifPresent(tmp::setOrganization);
        tmp = userRepository.save(tmp);
        Long id = tmp.getId();
        try {
            mvc.perform(post("/api/gdpr/erase/" + id).header("Authorization", bearer(ADMIN)))
                    .andExpect(status().isOk());
            allUsers after = userRepository.findById(id).orElseThrow();
            assertThat(after.getEmail()).doesNotContain("mtncameroon");
            assertThat(after.getFirstName()).isEqualTo("Deleted");
            assertThat(after.isActive()).isFalse();
        } finally {
            userRepository.deleteById(id);
        }
    }
}
