package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.TaskTemplate;
import com.example.gpiApp.service.TaskTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task templates. Any authenticated user may read the active templates (to create tasks from them);
 * managing them requires the template.manage permission (admins + PMs by default).
 */
@RestController
@RequestMapping("/api/task-templates")
@RequiredArgsConstructor
public class TaskTemplateController {

    private final TaskTemplateService service;

    /** Active templates — used by the "create from template" flow. */
    @GetMapping
    public ResponseEntity<List<TaskTemplate>> listActive() {
        return ResponseEntity.ok(service.list(true));
    }

    /** All templates including disabled — for the management page. */
    @GetMapping("/all")
    @PreAuthorize("@perm.has('template.manage')")
    public ResponseEntity<List<TaskTemplate>> listAll() {
        return ResponseEntity.ok(service.list(false));
    }

    @PostMapping
    @PreAuthorize("@perm.has('template.manage')")
    public ResponseEntity<ApiResponse<TaskTemplate>> create(@RequestBody TaskTemplate t) {
        return ResponseEntity.ok(ApiResponse.success("Template created", service.create(t)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('template.manage')")
    public ResponseEntity<ApiResponse<TaskTemplate>> update(@PathVariable Long id, @RequestBody TaskTemplate t) {
        return ResponseEntity.ok(ApiResponse.success("Template updated", service.update(id, t)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('template.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted", null));
    }
}
