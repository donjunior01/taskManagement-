package com.example.gpiApp.controller;

import com.example.gpiApp.security.Permission;
import com.example.gpiApp.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/** The current user's effective permission keys, so the SPA can gate menus/routes/actions by RBAC. */
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionsController {

    private final PermissionService permissionService;

    @GetMapping("/me")
    public ResponseEntity<List<String>> myPermissions(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).build();
        }
        // Principal is a userdetails.User (username = email); resolve the entity by email.
        List<String> keys = permissionService.effectivePermissionsByEmail(authentication.getName()).stream()
                .map(Permission::getKey)
                .sorted()
                .collect(Collectors.toList());
        return ResponseEntity.ok(keys);
    }
}
