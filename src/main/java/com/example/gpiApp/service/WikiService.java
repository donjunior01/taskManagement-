package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.WikiPage;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Tenant-scoped CRUD for the knowledge base / wiki. */
@Service
@RequiredArgsConstructor
public class WikiService {

    private final WikiPageRepository repository;

    @Transactional(readOnly = true)
    public List<WikiPage> list() {
        Long org = TenantContext.getOrganizationId();
        return org != null ? repository.findByOrganizationIdOrderByTitleAsc(org) : repository.findAll();
    }

    @Transactional(readOnly = true)
    public WikiPage get(Long id) {
        return getOwned(id);
    }

    @Transactional
    public WikiPage create(WikiPage p, allUsers actor) {
        p.setId(null);
        if (p.getTitle() == null || p.getTitle().isBlank()) throw new IllegalArgumentException("A page title is required.");
        if (actor != null) {
            p.setCreatedById(actor.getId());
            p.setCreatedByName(displayName(actor));
            p.setUpdatedById(actor.getId());
            p.setUpdatedByName(displayName(actor));
        }
        return repository.save(p); // TenantListener stamps the org
    }

    @Transactional
    public WikiPage update(Long id, WikiPage patch, allUsers actor) {
        WikiPage p = getOwned(id);
        if (patch.getTitle() != null) p.setTitle(patch.getTitle());
        p.setContent(patch.getContent());
        p.setParentId(patch.getParentId());
        p.setIcon(patch.getIcon());
        if (actor != null) {
            p.setUpdatedById(actor.getId());
            p.setUpdatedByName(displayName(actor));
        }
        return repository.save(p);
    }

    @Transactional
    public void delete(Long id) {
        WikiPage p = getOwned(id);
        // Re-parent direct children to this page's parent so the tree never orphans.
        Long org = TenantContext.getOrganizationId();
        if (org != null) {
            for (WikiPage child : repository.findByOrganizationIdAndParentId(org, id)) {
                child.setParentId(p.getParentId());
                repository.save(child);
            }
        }
        repository.delete(p);
    }

    private String displayName(allUsers u) {
        String fn = u.getFirstName() != null ? u.getFirstName() : "";
        String ln = u.getLastName() != null ? u.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return !name.isEmpty() ? name : u.getUsername();
    }

    private WikiPage getOwned(Long id) {
        WikiPage p = repository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Page not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && p.getOrganizationId() != null && !org.equals(p.getOrganizationId()))
            throw new AccessDeniedException("This page belongs to another organization.");
        return p;
    }
}
