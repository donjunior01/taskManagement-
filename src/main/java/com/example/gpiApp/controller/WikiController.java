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
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private allUsers actor(Authentication auth) {
        return auth != null ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
    }

    /**
     * Notify anyone currently viewing this page that it changed, so their client can live-refresh.
     * Scoped by page id (already tenant-scoped) — only someone who holds the page is subscribed.
     * Called after the service transaction has committed (the return of a @Transactional method).
     */
    private void broadcast(Long pageId, String type, allUsers by) {
        try {
            java.util.Map<String, Object> event = new java.util.HashMap<>();
            event.put("type", type);
            event.put("pageId", pageId);
            event.put("byId", by != null ? by.getId() : null);
            event.put("byName", by != null ? displayName(by) : null);
            messagingTemplate.convertAndSend("/topic/wiki-page/" + pageId, event);
        } catch (Exception ignored) {
            // Real-time refresh is best-effort; never fail the request because a broadcast failed.
        }
    }

    private String displayName(allUsers u) {
        String fn = u.getFirstName() != null ? u.getFirstName() : "";
        String ln = u.getLastName() != null ? u.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return !name.isEmpty() ? name : u.getUsername();
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
        allUsers by = actor(auth);
        WikiPage saved = service.update(id, page, by);
        broadcast(id, "updated", by);
        return ResponseEntity.ok(ApiResponse.success("Page saved", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('wiki.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        allUsers by = actor(auth);
        service.delete(id);
        broadcast(id, "deleted", by);
        return ResponseEntity.ok(ApiResponse.success("Page deleted", null));
    }
}
