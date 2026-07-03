package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.Objective;
import com.example.gpiApp.repository.KeyResultRepository;
import com.example.gpiApp.repository.ObjectiveRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** Unit tests for OKR validation and the cross-tenant guard on objectives. */
@ExtendWith(MockitoExtension.class)
class OkrServiceTest {

    @Mock private ObjectiveRepository objectiveRepository;
    @Mock private KeyResultRepository keyResultRepository;
    @InjectMocks private OkrService service;

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void createObjectiveRejectsABlankTitle() {
        assertThatThrownBy(() -> service.createObjective(Objective.builder().title(" ").build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updatingAnObjectiveFromAnotherOrgIsDenied() {
        TenantContext.setOrganizationId(1L);
        Objective foreign = Objective.builder().title("Goal").build();
        foreign.setId(3L);
        foreign.setOrganizationId(2L);
        when(objectiveRepository.findById(3L)).thenReturn(Optional.of(foreign));
        assertThatThrownBy(() -> service.updateObjective(3L, Objective.builder().title("Hijack").build()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void addingAKeyResultUnderAnotherOrgsObjectiveIsDenied() {
        TenantContext.setOrganizationId(1L);
        Objective foreign = Objective.builder().title("Goal").build();
        foreign.setId(4L);
        foreign.setOrganizationId(2L);
        when(objectiveRepository.findById(4L)).thenReturn(Optional.of(foreign));
        assertThatThrownBy(() -> service.addKeyResult(4L,
                com.example.gpiApp.entity.KeyResult.builder().title("KR").build()))
                .isInstanceOf(AccessDeniedException.class);
    }
}
