package com.example.gpiApp.controller;

import com.example.gpiApp.entity.SavedFilter;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.SavedFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Server-side saved filters / views. Any authenticated tenant member manages their own; results are
 * org-scoped. Returns raw payloads (no envelope) to match the ApiService binding convention.
 */
@RestController
@RequestMapping("/api/saved-filters")
@RequiredArgsConstructor
public class SavedFilterController {

    private final SavedFilterService service;
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
    public ResponseEntity<List<SavedFilter>> list(@RequestParam(value = "resource", required = false) String resource,
                                                  Authentication auth) {
        return ResponseEntity.ok(service.list(userId(auth), resource));
    }

    @PostMapping
    public ResponseEntity<SavedFilter> create(@RequestBody SavedFilter filter, Authentication auth) {
        return ResponseEntity.ok(service.create(filter, userId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedFilter> update(@PathVariable Long id, @RequestBody SavedFilter patch, Authentication auth) {
        return ResponseEntity.ok(service.update(id, patch, userId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, userId(auth));
        return ResponseEntity.noContent().build();
    }
}
