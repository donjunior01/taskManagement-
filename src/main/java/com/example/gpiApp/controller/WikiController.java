package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.WikiPage;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.WikiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Knowledge base / wiki. Any authenticated tenant member can read, create and edit pages
 * (collaborative); deleting a page requires the wiki.manage permission (admins + PMs by default).
 */
@RestController
@RequestMapping("/api/wiki-pages")
@RequiredArgsConstructor
public class WikiController {

    private final WikiService service;
    private final UserRepository userRepository;

    private allUsers actor(Authentication auth) {
        return auth != null ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
    }

    @GetMapping
    public ResponseEntity<List<WikiPage>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WikiPage> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WikiPage>> create(@RequestBody WikiPage page, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Page created", service.create(page, actor(auth))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WikiPage>> update(@PathVariable Long id, @RequestBody WikiPage page, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Page saved", service.update(id, page, actor(auth))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('wiki.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Page deleted", null));
    }
}
