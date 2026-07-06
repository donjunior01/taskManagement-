package com.example.gpiApp.controller;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Minimal SCIM 2.0 (RFC 7644) Users provisioning endpoint so an IdP can auto-provision and
 * deprovision accounts. Authenticated by its own bearer token (SCIM_TOKEN) — independent of the app
 * JWT — and permitted in SecurityConfig. Users are provisioned into the configured organization and
 * authenticate via SSO (a random local password is set). Disabled until SCIM_TOKEN is configured.
 */
@RestController
@RequestMapping("/scim/v2/Users")
@RequiredArgsConstructor
public class ScimController {

    private static final String USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
    private static final String LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${scim.token:}") private String scimToken;
    @Value("${scim.organization-id:1}") private Long scimOrgId;

    private void authorize(String auth) {
        if (scimToken == null || scimToken.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SCIM is not configured");
        if (auth == null || !auth.equals("Bearer " + scimToken))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid SCIM token");
    }

    // ── Provision ──
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                                       @RequestBody Map<String, Object> body) {
        authorize(auth);
        String email = primaryEmail(body);
        if (email == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userName/email is required");
        if (userRepository.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");

        @SuppressWarnings("unchecked")
        Map<String, Object> name = (Map<String, Object>) body.getOrDefault("name", Map.of());
        allUsers u = new allUsers();
        u.setUsername(email);
        u.setEmail(email);
        u.setFirstName(String.valueOf(name.getOrDefault("givenName", "")));
        u.setLastName(String.valueOf(name.getOrDefault("familyName", "")));
        u.setRole(allUsers.Role.USER);
        u.setActive(body.get("active") == null || Boolean.TRUE.equals(body.get("active")));
        u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        u.setPasswordChangedAt(LocalDateTime.now());
        organizationRepository.findById(scimOrgId).ifPresent(u::setOrganization);
        return ResponseEntity.status(HttpStatus.CREATED).body(toScim(userRepository.save(u)));
    }

    // ── Read ──
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@RequestHeader(value = "Authorization", required = false) String auth,
                                                   @PathVariable Long id) {
        authorize(auth);
        return ResponseEntity.ok(toScim(owned(id)));
    }

    // ── Search (SCIM filter: userName eq "x") ──
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestHeader(value = "Authorization", required = false) String auth,
                                                       @RequestParam(value = "filter", required = false) String filter) {
        authorize(auth);
        List<Map<String, Object>> resources = new ArrayList<>();
        if (filter != null && filter.toLowerCase().contains("username eq")) {
            String email = filter.replaceAll("(?i).*username eq\\s*\"?([^\"]+)\"?.*", "$1").trim();
            userRepository.findByEmail(email)
                    .filter(u -> u.getOrganization() != null && scimOrgId.equals(u.getOrganization().getId()))
                    .ifPresent(u -> resources.add(toScim(u)));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("schemas", List.of(LIST_SCHEMA));
        out.put("totalResults", resources.size());
        out.put("Resources", resources);
        return ResponseEntity.ok(out);
    }

    // ── Deprovision: PATCH active:false (SCIM), or DELETE → deactivate ──
    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> patch(@RequestHeader(value = "Authorization", required = false) String auth,
                                                      @PathVariable Long id, @RequestBody Map<String, Object> body) {
        authorize(auth);
        allUsers u = owned(id);
        Boolean active = activeFromPatch(body);
        if (active != null) u.setActive(active);
        return ResponseEntity.ok(toScim(userRepository.save(u)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @PathVariable Long id) {
        authorize(auth);
        allUsers u = owned(id);
        u.setActive(false);                 // deprovision = deactivate (keeps history/attribution)
        userRepository.save(u);
        return ResponseEntity.noContent().build();
    }

    // ── helpers ──
    private allUsers owned(Long id) {
        allUsers u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (u.getOrganization() == null || !scimOrgId.equals(u.getOrganization().getId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        return u;
    }

    @SuppressWarnings("unchecked")
    private String primaryEmail(Map<String, Object> body) {
        Object emails = body.get("emails");
        if (emails instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> first) {
            Object v = ((Map<String, Object>) first).get("value");
            if (v != null) return String.valueOf(v).trim().toLowerCase();
        }
        Object userName = body.get("userName");
        return userName != null ? String.valueOf(userName).trim().toLowerCase() : null;
    }

    @SuppressWarnings("unchecked")
    private Boolean activeFromPatch(Map<String, Object> body) {
        if (body.get("active") instanceof Boolean b) return b;                 // simple form
        Object ops = body.get("Operations");
        if (ops instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> op && "replace".equalsIgnoreCase(String.valueOf(op.get("op")))) {
                    Object val = ((Map<String, Object>) op).get("value");
                    if (val instanceof Boolean b) return b;
                    if (val instanceof Map<?, ?> vm && vm.get("active") instanceof Boolean b) return b;
                    if ("active".equalsIgnoreCase(String.valueOf(op.get("path"))) && val != null)
                        return Boolean.parseBoolean(String.valueOf(val));
                }
            }
        }
        return null;
    }

    private Map<String, Object> toScim(allUsers u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("schemas", List.of(USER_SCHEMA));
        m.put("id", String.valueOf(u.getId()));
        m.put("userName", u.getEmail());
        m.put("name", Map.of("givenName", nz(u.getFirstName()), "familyName", nz(u.getLastName())));
        m.put("emails", List.of(Map.of("value", nz(u.getEmail()), "primary", true)));
        m.put("active", u.isActive());
        m.put("meta", Map.of("resourceType", "User"));
        return m;
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
