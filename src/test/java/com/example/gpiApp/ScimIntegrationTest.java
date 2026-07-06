package com.example.gpiApp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.gpiApp.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Integration tests for the SCIM 2.0 provisioning endpoint (token-gated). */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = { "scim.token=test-scim-token", "scim.organization-id=1" })
class ScimIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository userRepository;

    private static final String BEARER = "Bearer test-scim-token";
    private final String email = "scim_" + UUID.randomUUID().toString().substring(0, 8) + "@mtncameroon.cm";

    @AfterEach
    void cleanup() {
        userRepository.findByEmail(email).ifPresent(u -> userRepository.deleteById(u.getId()));
    }

    @Test
    void rejectsRequestsWithoutTheScimToken() throws Exception {
        mvc.perform(post("/scim/v2/Users").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void provisionsSearchesAndDeprovisionsAUser() throws Exception {
        String body = "{\"schemas\":[\"urn:ietf:params:scim:schemas:core:2.0:User\"],"
                + "\"userName\":\"" + email + "\","
                + "\"name\":{\"givenName\":\"Scim\",\"familyName\":\"Bot\"},\"active\":true}";

        MvcResult created = mvc.perform(post("/scim/v2/Users").header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn();
        JsonNode j = om.readTree(created.getResponse().getContentAsString());
        String id = j.get("id").asText();
        assertThat(j.get("userName").asText()).isEqualTo(email);
        assertThat(j.get("active").asBoolean()).isTrue();

        // read by id
        mvc.perform(get("/scim/v2/Users/" + id).header("Authorization", BEARER)).andExpect(status().isOk());

        // search by userName filter
        MvcResult search = mvc.perform(get("/scim/v2/Users")
                        .param("filter", "userName eq \"" + email + "\"").header("Authorization", BEARER))
                .andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(search.getResponse().getContentAsString()).get("totalResults").asInt()).isEqualTo(1);

        // deprovision via PATCH active:false
        MvcResult patched = mvc.perform(patch("/scim/v2/Users/" + id).header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"Operations\":[{\"op\":\"replace\",\"path\":\"active\",\"value\":false}]}"))
                .andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(patched.getResponse().getContentAsString()).get("active").asBoolean()).isFalse();
    }
}
