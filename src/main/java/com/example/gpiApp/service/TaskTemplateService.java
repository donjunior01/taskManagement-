package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.TaskTemplate;
import com.example.gpiApp.repository.TaskTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Tenant-scoped CRUD for reusable task templates. */
@Service
@RequiredArgsConstructor
public class TaskTemplateService {

    private final TaskTemplateRepository repository;

    @Transactional(readOnly = true)
    public List<TaskTemplate> list(boolean activeOnly) {
        Long org = TenantContext.getOrganizationId();
        if (org == null) return repository.findAll();
        return activeOnly
                ? repository.findByOrganizationIdAndActiveTrueOrderByNameAsc(org)
                : repository.findByOrganizationIdOrderByNameAsc(org);
    }

    @Transactional
    public TaskTemplate create(TaskTemplate t) {
        t.setId(null);
        validate(t);
        return repository.save(t); // TenantListener stamps the org
    }

    @Transactional
    public TaskTemplate update(Long id, TaskTemplate patch) {
        TaskTemplate t = getOwned(id);
        if (patch.getName() != null) t.setName(patch.getName());
        t.setTaskName(patch.getTaskName());
        t.setDescription(patch.getDescription());
        if (patch.getPriority() != null) t.setPriority(patch.getPriority());
        if (patch.getDifficulty() != null) t.setDifficulty(patch.getDifficulty());
        t.setDefaultDeadlineDays(patch.getDefaultDeadlineDays());
        if (patch.getCustomFields() != null) t.setCustomFields(patch.getCustomFields());
        t.setActive(patch.isActive());
        validate(t);
        return repository.save(t);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getOwned(id));
    }

    private void validate(TaskTemplate t) {
        if (t.getName() == null || t.getName().isBlank())
            throw new IllegalArgumentException("Template name is required.");
    }

    private TaskTemplate getOwned(Long id) {
        TaskTemplate t = repository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Template not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && t.getOrganizationId() != null && !org.equals(t.getOrganizationId()))
            throw new AccessDeniedException("This template belongs to another organization.");
        return t;
    }
}
