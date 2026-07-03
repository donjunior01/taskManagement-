package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.WorkflowStatus;
import com.example.gpiApp.repository.WorkflowStatusRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** Unit tests for custom workflow statuses: category→enum mapping, validation and tenant guard. */
@ExtendWith(MockitoExtension.class)
class WorkflowStatusServiceTest {

    @Mock private WorkflowStatusRepository repository;
    @InjectMocks private WorkflowStatusService service;

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void categoryMapsToTheCanonicalTaskStatus() {
        assertThat(status(WorkflowStatus.Category.DONE).toTaskStatus()).isEqualTo(Task.TaskStatus.COMPLETED);
        assertThat(status(WorkflowStatus.Category.IN_PROGRESS).toTaskStatus()).isEqualTo(Task.TaskStatus.IN_PROGRESS);
        assertThat(status(WorkflowStatus.Category.TODO).toTaskStatus()).isEqualTo(Task.TaskStatus.TODO);
    }

    @Test
    void createRejectsABlankName() {
        assertThatThrownBy(() -> service.create(WorkflowStatus.builder().name("  ").build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void resolvingAStatusFromAnotherOrgIsDenied() {
        TenantContext.setOrganizationId(1L);
        WorkflowStatus foreign = status(WorkflowStatus.Category.TODO);
        foreign.setId(7L);
        foreign.setOrganizationId(2L);                       // belongs to a different tenant
        when(repository.findById(7L)).thenReturn(Optional.of(foreign));
        assertThatThrownBy(() -> service.getForTenant(7L)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void resolvingAStatusFromTheSameOrgSucceeds() {
        TenantContext.setOrganizationId(1L);
        WorkflowStatus own = status(WorkflowStatus.Category.IN_PROGRESS);
        own.setId(8L);
        own.setOrganizationId(1L);
        when(repository.findById(8L)).thenReturn(Optional.of(own));
        assertThat(service.getForTenant(8L)).isSameAs(own);
    }

    private WorkflowStatus status(WorkflowStatus.Category c) {
        return WorkflowStatus.builder().name("Col").category(c).build();
    }
}
