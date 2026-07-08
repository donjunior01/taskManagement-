package com.example.gpiApp.service;

import com.example.gpiApp.entity.SavedFilter;
import com.example.gpiApp.repository.SavedFilterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD for server-side saved filters. Tenant-scoped by the @Filter (active in these @Transactional
 * methods); a filter can only be edited or deleted by its owner. Listing returns the caller's own
 * filters plus any a colleague shared org-wide.
 */
@Service
@RequiredArgsConstructor
public class SavedFilterService {

    private final SavedFilterRepository repository;

    @Transactional(readOnly = true)
    public List<SavedFilter> list(Long userId, String resource) {
        return repository.findVisible(userId, resource == null || resource.isBlank() ? "tasks" : resource);
    }

    @Transactional
    public SavedFilter create(SavedFilter f, Long userId) {
        if (f.getName() == null || f.getName().isBlank()) throw new IllegalArgumentException("Filter name is required.");
        f.setId(null);
        f.setUserId(userId);
        if (f.getResource() == null || f.getResource().isBlank()) f.setResource("tasks");
        return repository.save(f); // TenantListener stamps the org
    }

    @Transactional
    public SavedFilter update(Long id, SavedFilter patch, Long userId) {
        SavedFilter f = getOwned(id, userId);
        if (patch.getName() != null && !patch.getName().isBlank()) f.setName(patch.getName());
        if (patch.getCriteria() != null) f.setCriteria(patch.getCriteria());
        f.setShared(patch.isShared());
        return repository.save(f);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        repository.delete(getOwned(id, userId));
    }

    private SavedFilter getOwned(Long id, Long userId) {
        SavedFilter f = repository.findById(id).orElseThrow(() -> new AccessDeniedException("Filter not found"));
        if (!userId.equals(f.getUserId())) throw new AccessDeniedException("This filter belongs to another user.");
        return f;
    }
}
