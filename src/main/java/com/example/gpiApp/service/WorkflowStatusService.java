package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.WorkflowStatus;
import com.example.gpiApp.repository.WorkflowStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Tenant-scoped CRUD for custom workflow statuses (board columns). */
@Service
@RequiredArgsConstructor
public class WorkflowStatusService {

    private final WorkflowStatusRepository repository;

    @Transactional(readOnly = true)
    public List<WorkflowStatus> list(boolean activeOnly) {
        Long org = TenantContext.getOrganizationId();
        if (org == null) return repository.findAll();
        return activeOnly
                ? repository.findByOrganizationIdAndActiveTrueOrderByDisplayOrderAscIdAsc(org)
                : repository.findByOrganizationIdOrderByDisplayOrderAscIdAsc(org);
    }

    @Transactional
    public WorkflowStatus create(WorkflowStatus s) {
        s.setId(null);
        validate(s);
        return repository.save(s); // TenantListener stamps the org
    }

    @Transactional
    public WorkflowStatus update(Long id, WorkflowStatus patch) {
        WorkflowStatus s = getOwned(id);
        if (patch.getName() != null) s.setName(patch.getName());
        if (patch.getCategory() != null) s.setCategory(patch.getCategory());
        s.setColor(patch.getColor());
        s.setDisplayOrder(patch.getDisplayOrder());
        s.setActive(patch.isActive());
        validate(s);
        return repository.save(s);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getOwned(id));
    }

    /** Resolve a status owned by the current tenant (used when a task is moved to a custom column). */
    @Transactional(readOnly = true)
    public WorkflowStatus getForTenant(Long id) {
        return getOwned(id);
    }

    private void validate(WorkflowStatus s) {
        if (s.getName() == null || s.getName().isBlank())
            throw new IllegalArgumentException("Status name is required.");
    }

    private WorkflowStatus getOwned(Long id) {
        WorkflowStatus s = repository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Status not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && s.getOrganizationId() != null && !org.equals(s.getOrganizationId()))
            throw new AccessDeniedException("This status belongs to another organization.");
        return s;
    }
}
