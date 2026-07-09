package com.example.gpiApp;

import com.example.gpiApp.entity.Organization;
import com.example.gpiApp.repository.OrganizationRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.PlanService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Plan-limit enforcement. FREE = 3 projects / 5 users; ENTERPRISE = unlimited. */
@ExtendWith(MockitoExtension.class)
class PlanServiceTest {

    @Mock OrganizationRepository organizationRepository;
    @Mock UserRepository userRepository;
    @Mock ProjectRepository projectRepository;
    @InjectMocks PlanService planService;

    private Organization orgOnPlan(String plan) {
        Organization org = mock(Organization.class);
        when(org.getPlan()).thenReturn(plan);
        return org;
    }

    @Test
    void nullOrgIsTreatedAsUnlimited() {
        assertTrue(planService.canAddProject(null));
        assertTrue(planService.canAddUser(null));
        verifyNoInteractions(organizationRepository, projectRepository, userRepository);
    }

    @Test
    void freePlanAllowsProjectsUnderLimitAndBlocksAtLimit() {
        Organization org = orgOnPlan("FREE");
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));

        when(projectRepository.countByOrganizationId(1L)).thenReturn(2L);
        assertTrue(planService.canAddProject(1L));   // 2 < 3

        when(projectRepository.countByOrganizationId(1L)).thenReturn(3L);
        assertFalse(planService.canAddProject(1L));  // at the 3-project limit
    }

    @Test
    void enterprisePlanHasNoProjectLimit() {
        Organization org = orgOnPlan("ENTERPRISE");
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));
        when(projectRepository.countByOrganizationId(1L)).thenReturn(9999L);

        assertTrue(planService.canAddProject(1L));
    }

    @Test
    void freePlanBlocksUsersAtSeatLimit() {
        Organization org = orgOnPlan("FREE");
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));
        when(userRepository.countByOrganizationId(1L)).thenReturn(5L); // FREE = 5 seats

        assertFalse(planService.canAddUser(1L));
    }
}
