package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.TaskTemplate;
import com.example.gpiApp.repository.TaskTemplateRepository;
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

/** Unit tests for task-template validation and the cross-tenant guard. */
@ExtendWith(MockitoExtension.class)
class TaskTemplateServiceTest {

    @Mock private TaskTemplateRepository repository;
    @InjectMocks private TaskTemplateService service;

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void createRejectsABlankName() {
        assertThatThrownBy(() -> service.create(TaskTemplate.builder().name(" ").build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deletingATemplateFromAnotherOrgIsDenied() {
        TenantContext.setOrganizationId(1L);
        TaskTemplate foreign = TaskTemplate.builder().name("Bug").build();
        foreign.setId(5L);
        foreign.setOrganizationId(2L);
        when(repository.findById(5L)).thenReturn(Optional.of(foreign));
        assertThatThrownBy(() -> service.delete(5L)).isInstanceOf(AccessDeniedException.class);
    }
}
