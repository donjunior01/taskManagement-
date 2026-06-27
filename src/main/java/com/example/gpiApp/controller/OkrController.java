package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.ObjectiveDTO;
import com.example.gpiApp.entity.KeyResult;
import com.example.gpiApp.entity.Objective;
import com.example.gpiApp.service.OkrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * OKRs — objectives & key results. Any authenticated member can view (OKRs are transparent across the
 * org); creating/editing/deleting requires the okr.manage permission (admins + PMs by default).
 */
@RestController
@RequestMapping("/api/okrs")
@RequiredArgsConstructor
public class OkrController {

    private final OkrService service;

    @GetMapping
    public ResponseEntity<List<ObjectiveDTO>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<Objective>> createObjective(@RequestBody Objective o) {
        return ResponseEntity.ok(ApiResponse.success("Objective created", service.createObjective(o)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<Objective>> updateObjective(@PathVariable Long id, @RequestBody Objective o) {
        return ResponseEntity.ok(ApiResponse.success("Objective updated", service.updateObjective(id, o)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<Void>> deleteObjective(@PathVariable Long id) {
        service.deleteObjective(id);
        return ResponseEntity.ok(ApiResponse.success("Objective deleted", null));
    }

    @PostMapping("/{objectiveId}/key-results")
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<KeyResult>> addKeyResult(@PathVariable Long objectiveId, @RequestBody KeyResult kr) {
        return ResponseEntity.ok(ApiResponse.success("Key result added", service.addKeyResult(objectiveId, kr)));
    }

    @PutMapping("/key-results/{krId}")
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<KeyResult>> updateKeyResult(@PathVariable Long krId, @RequestBody KeyResult kr) {
        return ResponseEntity.ok(ApiResponse.success("Key result updated", service.updateKeyResult(krId, kr)));
    }

    @DeleteMapping("/key-results/{krId}")
    @PreAuthorize("@perm.has('okr.manage')")
    public ResponseEntity<ApiResponse<Void>> deleteKeyResult(@PathVariable Long krId) {
        service.deleteKeyResult(krId);
        return ResponseEntity.ok(ApiResponse.success("Key result deleted", null));
    }
}
