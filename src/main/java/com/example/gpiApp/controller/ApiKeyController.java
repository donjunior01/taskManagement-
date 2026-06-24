package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiKeyDTO;
import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin-only management of the organization's API keys. */
@RestController
@RequestMapping("/api/api-keys")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('settings.manage')")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final com.example.gpiApp.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ApiKeyDTO>> list() {
        return ResponseEntity.ok(apiKeyService.listForCurrentTenant());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ApiKeyDTO>> create(@RequestBody Map<String, String> body, Authentication auth) {
        // Principal is a userdetails.User (username = email); resolve the creator entity by email.
        allUsers creator = auth != null ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
        ApiKeyDTO created = apiKeyService.create(body.get("name"), creator);
        return ResponseEntity.ok(ApiResponse.success("API key created", created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable Long id) {
        apiKeyService.revoke(id);
        return ResponseEntity.ok(ApiResponse.success("API key revoked", null));
    }
}
