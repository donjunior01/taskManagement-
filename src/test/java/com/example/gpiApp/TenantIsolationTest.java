package com.example.gpiApp;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

/** Enables tenant enforcement (test-only property) and proves reads are isolated per organization. */
@SpringBootTest
@TestPropertySource(properties = "app.multitenancy.enforce=true")
class TenantIsolationTest {

    @Autowired ProjectService projectService;
    @Autowired ProjectRepository projectRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired UserRepository userRepository;

    private List<String> names(PagedResponse<ProjectDTO> r) {
        return r.getData().stream().map(ProjectDTO::getName).toList();
    }

    @Test
    void readsAreIsolatedPerTenant() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        String p1Name = "ISOTEST_ORG1_" + tag;
        String p2Name = "ISOTEST_ORG2_" + tag;
        allUsers owner = userRepository.findById(100L).orElse(userRepository.findAll().get(0));

        Organization org2 = organizationRepository.save(
                Organization.builder().name("ISO Org 2 " + tag).slug("iso-" + tag).build());

        Project p1 = projectRepository.save(Project.builder()
                .name(p1Name).status(Project.ProjectStatus.ACTIVE).archived(false)
                .organizationId(1L).createdBy(owner).manager(owner).build());
        Project p2 = projectRepository.save(Project.builder()
                .name(p2Name).status(Project.ProjectStatus.ACTIVE).archived(false)
                .organizationId(org2.getId()).createdBy(owner).manager(owner).build());

        try {
            TenantContext.setOrganizationId(1L);
            List<String> asOrg1 = names(projectService.getAllProjects(0, 1000, "id", "asc"));
            System.out.println("ISO|org1 sees p1=" + asOrg1.contains(p1Name) + " p2=" + asOrg1.contains(p2Name));

            TenantContext.setOrganizationId(org2.getId());
            List<String> asOrg2 = names(projectService.getAllProjects(0, 1000, "id", "asc"));
            System.out.println("ISO|org2 sees p1=" + asOrg2.contains(p1Name) + " p2=" + asOrg2.contains(p2Name));

            boolean isolated = asOrg1.contains(p1Name) && !asOrg1.contains(p2Name)
                    && asOrg2.contains(p2Name) && !asOrg2.contains(p1Name);
            System.out.println("ISO|RESULT isolated=" + isolated);
        } finally {
            TenantContext.clear();
            projectRepository.delete(p1);
            projectRepository.delete(p2);
            organizationRepository.delete(org2);
        }
    }
}
