package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.CustomFieldDefinition;
import com.example.gpiApp.repository.CustomFieldDefinitionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** Unit tests for custom field validation and the cross-tenant guard. */
@ExtendWith(MockitoExtension.class)
class CustomFieldServiceTest {

    @Mock private CustomFieldDefinitionRepository repository;
    @InjectMocks private CustomFieldService service;

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void createRejectsABlankName() {
        assertThatThrownBy(() -> service.create(field("  ", CustomFieldDefinition.FieldType.TEXT, null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void selectFieldRequiresAtLeastOneOption() {
        assertThatThrownBy(() -> service.create(field("Severity", CustomFieldDefinition.FieldType.SELECT, "")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void validSelectFieldIsAccepted() {
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertThatCode(() -> service.create(field("Severity", CustomFieldDefinition.FieldType.SELECT, "Low,High")))
                .doesNotThrowAnyException();
    }

    @Test
    void updatingAFieldOwnedByAnotherOrgIsDenied() {
        TenantContext.setOrganizationId(1L);
        CustomFieldDefinition foreign = field("Sprint", CustomFieldDefinition.FieldType.TEXT, null);
        foreign.setId(9L);
        foreign.setOrganizationId(2L);
        when(repository.findById(9L)).thenReturn(Optional.of(foreign));
        assertThatThrownBy(() -> service.update(9L, field("Sprint", CustomFieldDefinition.FieldType.TEXT, null)))
                .isInstanceOf(AccessDeniedException.class);
    }

    private CustomFieldDefinition field(String name, CustomFieldDefinition.FieldType type, String options) {
        return CustomFieldDefinition.builder().name(name).fieldType(type).options(options).build();
    }
}
