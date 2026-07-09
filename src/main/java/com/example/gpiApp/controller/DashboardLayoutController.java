package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DashboardLayoutDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.DashboardLayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * Persists each user's customizable dashboard (which KPI widgets, in what order). Any authenticated
 * user manages their own; widget keys are stored as sanitized CSV. Returns a raw DTO (ApiService
 * binding convention).
 */
@RestController
@RequestMapping("/api/dashboard-layout")
@RequiredArgsConstructor
public class DashboardLayoutController {

    private final DashboardLayoutService service;
    private final UserRepository userRepository;

    private Long userId(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(auth.getName()).map(allUsers::getId)
                    .orElseGet(() -> userRepository.findByUsername(auth.getName()).map(allUsers::getId).orElse(null));
        }
    }

    @GetMapping
    public ResponseEntity<DashboardLayoutDTO> get(Authentication auth) {
        String csv = service.getWidgets(userId(auth));
        List<String> widgets = (csv == null || csv.isBlank()) ? List.of() : Arrays.asList(csv.split(","));
        return ResponseEntity.ok(new DashboardLayoutDTO(widgets));
    }

    @PutMapping
    public ResponseEntity<DashboardLayoutDTO> save(@RequestBody DashboardLayoutDTO body, Authentication auth) {
        List<String> widgets = body.getWidgets() == null ? List.of() :
                body.getWidgets().stream()
                        .filter(w -> w != null && w.matches("[A-Za-z0-9_]+")) // keys only; guards the CSV store
                        .distinct()
                        .toList();
        service.save(userId(auth), String.join(",", widgets));
        return ResponseEntity.ok(new DashboardLayoutDTO(widgets));
    }
}
