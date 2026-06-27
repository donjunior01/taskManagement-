package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.CustomFieldDefinition;
import com.example.gpiApp.service.CustomFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Custom field definitions. Any authenticated user may read the active fields (to render them on
 * tasks); managing them requires the customfield.manage permission (admins + PMs by default).
 */
@RestController
@RequestMapping("/api/custom-fields")
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldService service;

    /** Active fields — used by task forms. */
    @GetMapping
    public ResponseEntity<List<CustomFieldDefinition>> listActive() {
        return ResponseEntity.ok(service.list(true));
    }

    /** All fields including disabled — for the management page. */
    @GetMapping("/all")
    @PreAuthorize("@perm.has('customfield.manage')")
    public ResponseEntity<List<CustomFieldDefinition>> listAll() {
        return ResponseEntity.ok(service.list(false));
    }

    @PostMapping
    @PreAuthorize("@perm.has('customfield.manage')")
    public ResponseEntity<ApiResponse<CustomFieldDefinition>> create(@RequestBody CustomFieldDefinition f) {
        return ResponseEntity.ok(ApiResponse.success("Field created", service.create(f)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('customfield.manage')")
    public ResponseEntity<ApiResponse<CustomFieldDefinition>> update(@PathVariable Long id, @RequestBody CustomFieldDefinition f) {
        return ResponseEntity.ok(ApiResponse.success("Field updated", service.update(id, f)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('customfield.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Field deleted", null));
    }
}
