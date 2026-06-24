package com.example.gpiApp.security;

import com.example.gpiApp.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * SpEL helper for fine-grained checks: {@code @PreAuthorize("@perm.has('project.delete')")}. Resolves
 * the current user's effective permissions (custom role, else base-role defaults) via
 * {@link PermissionService}. Because base-role defaults mirror existing role behaviour, adding a check
 * is a no-op for users without a custom role and only newly constrains custom-role holders.
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionGuard {

    private final PermissionService permissionService;

    public boolean has(String permissionKey) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) return false;
        Permission permission = Permission.fromKey(permissionKey);
        if (permission == null) return false;
        // The principal is a userdetails.User (username = email), not the allUsers entity.
        return permissionService.hasPermissionByEmail(auth.getName(), permission);
    }
}
