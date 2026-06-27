package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.WorkflowStatus;
import com.example.gpiApp.service.WorkflowStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Custom workflow statuses (board columns). Any authenticated user may read the active ones (to render
 * the board); managing them requires the workflow.manage permission (admins + PMs by default).
 */
@RestController
@RequestMapping("/api/workflow-statuses")
@RequiredArgsConstructor
public class WorkflowStatusController {

    private final WorkflowStatusService service;

    /** Active statuses, ordered — used to render the Kanban columns. */
    @GetMapping
    public ResponseEntity<List<WorkflowStatus>> listActive() {
        return ResponseEntity.ok(service.list(true));
    }

    @GetMapping("/all")
    @PreAuthorize("@perm.has('workflow.manage')")
    public ResponseEntity<List<WorkflowStatus>> listAll() {
        return ResponseEntity.ok(service.list(false));
    }

    @PostMapping
    @PreAuthorize("@perm.has('workflow.manage')")
    public ResponseEntity<ApiResponse<WorkflowStatus>> create(@RequestBody WorkflowStatus s) {
        return ResponseEntity.ok(ApiResponse.success("Status created", service.create(s)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('workflow.manage')")
    public ResponseEntity<ApiResponse<WorkflowStatus>> update(@PathVariable Long id, @RequestBody WorkflowStatus s) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", service.update(id, s)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('workflow.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Status deleted", null));
    }
}
