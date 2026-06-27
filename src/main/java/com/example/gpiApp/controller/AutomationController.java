package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.AutomationRule;
import com.example.gpiApp.service.AutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Manage automation rules — requires the automation.manage permission (admins + PMs by default). */
@RestController
@RequestMapping("/api/automations")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('automation.manage')")
public class AutomationController {

    private final AutomationService automationService;

    /** Catalog of triggers/actions/condition-fields for the rule builder. */
    @GetMapping("/meta")
    public ResponseEntity<Map<String, Object>> meta() {
        return ResponseEntity.ok(Map.of(
                "triggers", AutomationService.TRIGGERS,
                "actions", AutomationService.ACTIONS,
                "conditionFields", AutomationService.CONDITION_FIELDS));
    }

    @GetMapping
    public ResponseEntity<List<AutomationRule>> list() {
        return ResponseEntity.ok(automationService.listForCurrentTenant());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AutomationRule>> create(@RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.success("Rule created", automationService.create(rule)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AutomationRule>> update(@PathVariable Long id, @RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.success("Rule updated", automationService.update(id, rule)));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<AutomationRule>> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Rule toggled", automationService.toggle(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        automationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Rule deleted", null));
    }
}
