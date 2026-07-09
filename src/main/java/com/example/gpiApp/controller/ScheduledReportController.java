package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.ScheduledReport;
import com.example.gpiApp.service.ScheduledReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Manage recurring report exports. Admins and project managers only; results are org-scoped by the
 * tenant filter. List endpoint returns a raw array (ApiService binding convention); mutations use the
 * ApiResponse envelope like the other admin controllers.
 */
@RestController
@RequestMapping("/api/scheduled-reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
public class ScheduledReportController {

    private final ScheduledReportService service;

    @GetMapping
    public ResponseEntity<List<ScheduledReport>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduledReport>> create(@RequestBody ScheduledReport report) {
        return ResponseEntity.ok(ApiResponse.success("Scheduled report created", service.create(report)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduledReport>> update(@PathVariable Long id, @RequestBody ScheduledReport report) {
        return ResponseEntity.ok(ApiResponse.success("Scheduled report updated", service.update(id, report)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Scheduled report deleted", null));
    }

    /** Generate and email this report right now (ignores the cadence). Returns emails dispatched. */
    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<Integer>> sendNow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Report sent", service.sendNow(id)));
    }
}
