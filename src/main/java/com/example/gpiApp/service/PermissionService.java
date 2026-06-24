package com.example.gpiApp.service;

import com.example.gpiApp.entity.Role;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.security.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolves a user's effective permissions: if they hold a custom role, exactly that role's
 * permissions; otherwise the default set for their base role. Used for fine-grained checks on top of
 * the existing coarse role guards (which remain in place).
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserRepository userRepository;

    /** Effective permissions for a loaded user (custom role overrides base-role defaults). */
    public Set<Permission> effectivePermissions(allUsers user) {
        if (user == null) return EnumSet.noneOf(Permission.class);
        // Admins are always full super-users: a custom role can never reduce an administrator's access,
        // so an admin can't accidentally lock themselves (or another admin) out of privileged actions.
        if (user.getRole() == allUsers.Role.ADMIN) return EnumSet.allOf(Permission.class);
        Role custom = user.getCustomRole();
        if (custom != null && custom.getPermissions() != null && !custom.getPermissions().isEmpty()) {
            return custom.getPermissions().stream()
                    .map(Permission::fromKey)
                    .filter(p -> p != null)
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));
        }
        return Permission.defaultsForBaseRole(user.getRole());
    }

    @Transactional(readOnly = true)
    public Set<Permission> effectivePermissions(Long userId) {
        return userRepository.findById(userId).map(this::effectivePermissions).orElse(EnumSet.noneOf(Permission.class));
    }

    /** The Spring Security principal is a userdetails.User (username = email), not the allUsers entity,
     *  so the current user is resolved by email rather than by casting the principal. */
    @Transactional(readOnly = true)
    public Set<Permission> effectivePermissionsByEmail(String email) {
        return userRepository.findByEmail(email).map(this::effectivePermissions).orElse(EnumSet.noneOf(Permission.class));
    }

    @Transactional(readOnly = true)
    public boolean hasPermissionByEmail(String email, Permission permission) {
        return userRepository.findByEmail(email).map(u -> hasPermission(u, permission)).orElse(false);
    }

    public boolean hasPermission(allUsers user, Permission permission) {
        return effectivePermissions(user).contains(permission);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(Long userId, Permission permission) {
        return userRepository.findById(userId).map(u -> hasPermission(u, permission)).orElse(false);
    }
}
