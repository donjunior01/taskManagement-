package com.example.gpiApp.service;

import com.example.gpiApp.entity.DashboardLayout;
import com.example.gpiApp.repository.DashboardLayoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads and upserts a user's dashboard layout (opaque JSON of widget keys). One row per user; created
 * on first save. The widget vocabulary lives in the frontend — the backend just stores the string.
 */
@Service
@RequiredArgsConstructor
public class DashboardLayoutService {

    private static final int MAX_LEN = 4000;

    private final DashboardLayoutRepository repository;

    @Transactional(readOnly = true)
    public String getWidgets(Long userId) {
        return repository.findByUserId(userId).map(DashboardLayout::getWidgets).orElse(null);
    }

    @Transactional
    public String save(Long userId, String widgets) {
        if (widgets != null && widgets.length() > MAX_LEN)
            throw new IllegalArgumentException("Layout is too large.");
        DashboardLayout layout = repository.findByUserId(userId)
                .orElseGet(() -> DashboardLayout.builder().userId(userId).build());
        layout.setWidgets(widgets);
        return repository.save(layout).getWidgets();
    }
}
