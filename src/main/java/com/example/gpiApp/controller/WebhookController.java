package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.WebhookDTO;
import com.example.gpiApp.service.WebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only management of outbound webhook subscriptions. */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('settings.manage')")
public class WebhookController {

    private final WebhookService webhookService;

    @GetMapping("/events")
    public ResponseEntity<List<String>> catalog() {
        return ResponseEntity.ok(webhookService.catalog());
    }

    @GetMapping
    public ResponseEntity<List<WebhookDTO>> list() {
        return ResponseEntity.ok(webhookService.listForCurrentTenant());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WebhookDTO>> create(@RequestBody WebhookDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Webhook created", webhookService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WebhookDTO>> update(@PathVariable Long id, @RequestBody WebhookDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Webhook updated", webhookService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        webhookService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Webhook deleted", null));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<ApiResponse<Void>> test(@PathVariable Long id) {
        webhookService.test(id);
        return ResponseEntity.ok(ApiResponse.success("Test delivery queued", null));
    }
}
