package com.example.gpiApp;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

/** Proves users are isolated per organization once enforcement is on. */
@SpringBootTest
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class TenantUserIsolationTest {

    @Autowired UserService userService;
    @Autowired UserRepository userRepository;
    @Autowired OrganizationRepository organizationRepository;

    private List<String> emails() {
        UserListResponseDTO r = userService.getAllUsers(0, 1000, "id", "asc");
        return r.getData().stream().map(u -> u.getEmail()).toList();
    }

    @Test
    void usersAreIsolatedPerTenant() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Organization org2 = organizationRepository.save(
                Organization.builder().name("ISO Users Org " + tag).slug("isou-" + tag).build());

        allUsers u1 = mk("isou1_" + tag, 1L);
        allUsers u2 = mk("isou2_" + tag, org2.getId());
        u1 = userRepository.save(u1);
        u2 = userRepository.save(u2);

        try {
            TenantContext.setOrganizationId(1L);
            List<String> asOrg1 = emails();
            System.out.println("ISOU|org1 sees u1=" + asOrg1.contains(u1.getEmail()) + " u2=" + asOrg1.contains(u2.getEmail()));

            TenantContext.setOrganizationId(org2.getId());
            List<String> asOrg2 = emails();
            System.out.println("ISOU|org2 sees u1=" + asOrg2.contains(u1.getEmail()) + " u2=" + asOrg2.contains(u2.getEmail()));

            boolean isolated = asOrg1.contains(u1.getEmail()) && !asOrg1.contains(u2.getEmail())
                    && asOrg2.contains(u2.getEmail()) && !asOrg2.contains(u1.getEmail());
            System.out.println("ISOU|RESULT isolated=" + isolated);
        } finally {
            TenantContext.clear();
            userRepository.delete(u1);
            userRepository.delete(u2);
            organizationRepository.delete(org2);
        }
    }

    private allUsers mk(String tag, Long orgId) {
        allUsers u = new allUsers();
        u.setUsername(tag);
        u.setEmail(tag + "@iso.test");
        u.setPassword("x");
        u.setFirstName("Iso");
        u.setLastName(tag);
        u.setRole(allUsers.Role.USER);
        u.setActive(true);
        organizationRepository.findById(orgId).ifPresent(u::setOrganization);
        return u;
    }
}
