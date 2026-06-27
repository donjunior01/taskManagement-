package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.CustomFieldDefinition;
import com.example.gpiApp.repository.CustomFieldDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Tenant-scoped CRUD for custom field definitions. */
@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldDefinitionRepository repository;

    @Transactional(readOnly = true)
    public List<CustomFieldDefinition> list(boolean activeOnly) {
        Long org = TenantContext.getOrganizationId();
        if (org == null) return repository.findAll();
        return activeOnly
                ? repository.findByOrganizationIdAndActiveTrueOrderByDisplayOrderAscIdAsc(org)
                : repository.findByOrganizationIdOrderByDisplayOrderAscIdAsc(org);
    }

    @Transactional
    public CustomFieldDefinition create(CustomFieldDefinition f) {
        f.setId(null);
        validate(f);
        return repository.save(f); // TenantListener stamps the org
    }

    @Transactional
    public CustomFieldDefinition update(Long id, CustomFieldDefinition patch) {
        CustomFieldDefinition f = getOwned(id);
        if (patch.getName() != null) f.setName(patch.getName());
        if (patch.getFieldType() != null) f.setFieldType(patch.getFieldType());
        f.setOptions(patch.getOptions());
        f.setRequired(patch.isRequired());
        f.setDisplayOrder(patch.getDisplayOrder());
        f.setActive(patch.isActive());
        validate(f);
        return repository.save(f);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getOwned(id));
    }

    private void validate(CustomFieldDefinition f) {
        if (f.getName() == null || f.getName().isBlank())
            throw new IllegalArgumentException("Field name is required.");
        if (f.getFieldType() == CustomFieldDefinition.FieldType.SELECT
                && (f.getOptions() == null || f.getOptions().isBlank()))
            throw new IllegalArgumentException("A dropdown field needs at least one option.");
    }

    private CustomFieldDefinition getOwned(Long id) {
        CustomFieldDefinition f = repository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Field not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && f.getOrganizationId() != null && !org.equals(f.getOrganizationId()))
            throw new AccessDeniedException("This field belongs to another organization.");
        return f;
    }
}
