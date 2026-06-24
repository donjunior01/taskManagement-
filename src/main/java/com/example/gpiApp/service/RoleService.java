package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.RoleDTO;
import com.example.gpiApp.entity.Role;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.RoleRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.security.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Admin management of custom roles (scoped to the caller's tenant) and assignment to users. */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    /** The full catalog of grantable permissions, grouped for the UI. */
    public List<Map<String, String>> permissionCatalog() {
        List<Map<String, String>> out = new ArrayList<>();
        for (Permission p : Permission.values()) {
            String group = p.getKey().contains(".") ? p.getKey().substring(0, p.getKey().indexOf('.')) : "other";
            out.add(Map.of("key", p.getKey(), "name", p.name(), "group", group));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<RoleDTO> listForCurrentTenant() {
        Long org = TenantContext.getOrganizationId();
        List<Role> roles = org != null ? roleRepository.findByOrganizationIdOrderByNameAsc(org) : roleRepository.findAll();
        // Built-in access levels first (read-only), then the tenant's custom roles.
        List<RoleDTO> out = new ArrayList<>(systemRoles());
        roles.stream().map(this::toDTO).forEach(out::add);
        return out;
    }

    /** The three built-in access levels with their effective default permissions (display only). */
    private List<RoleDTO> systemRoles() {
        List<RoleDTO> out = new ArrayList<>();
        for (allUsers.Role base : allUsers.Role.values()) {
            out.add(RoleDTO.builder()
                    .id(null)
                    .baseRole(base.name())
                    .name(displayName(base))
                    .description("Built-in access level — assigned via the user's role.")
                    .system(true)
                    .permissions(Permission.defaultsForBaseRole(base).stream()
                            .map(Permission::getKey)
                            .collect(Collectors.toCollection(java.util.LinkedHashSet::new)))
                    .build());
        }
        return out;
    }

    private String displayName(allUsers.Role base) {
        switch (base) {
            case ADMIN: return "Administrator";
            case PROJECT_MANAGER: return "Project Manager";
            case USER:
            default: return "User";
        }
    }

    @Transactional
    public RoleDTO create(RoleDTO dto) {
        Role role = Role.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .system(false)
                .permissions(sanitize(dto.getPermissions()))
                .build();
        return toDTO(roleRepository.save(role));   // TenantListener stamps the organization
    }

    @Transactional
    public RoleDTO update(Long id, RoleDTO dto) {
        Role role = getOwned(id);
        if (dto.getName() != null) role.setName(dto.getName());
        if (dto.getDescription() != null) role.setDescription(dto.getDescription());
        if (dto.getPermissions() != null) role.setPermissions(sanitize(dto.getPermissions()));
        return toDTO(roleRepository.save(role));
    }

    @Transactional
    public void delete(Long id) {
        Role role = getOwned(id);
        if (role.isSystem()) throw new AccessDeniedException("System roles cannot be deleted.");
        roleRepository.delete(role);
    }

    @Transactional
    public void assignToUser(Long userId, Long roleId) {
        allUsers user = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));
        if (roleId == null) {
            user.setCustomRole(null);
        } else {
            user.setCustomRole(getOwned(roleId));
        }
        userRepository.save(user);
    }

    /** Load a role and verify it belongs to the caller's tenant. */
    private Role getOwned(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Role not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && role.getOrganizationId() != null && !org.equals(role.getOrganizationId())) {
            throw new AccessDeniedException("This role belongs to another organization.");
        }
        return role;
    }

    /** Keep only valid permission keys from the catalog. */
    private java.util.Set<String> sanitize(java.util.Set<String> keys) {
        if (keys == null) return new HashSet<>();
        return keys.stream().filter(k -> Permission.fromKey(k) != null).collect(Collectors.toCollection(HashSet::new));
    }

    private RoleDTO toDTO(Role r) {
        return RoleDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .system(r.isSystem())
                .permissions(r.getPermissions() != null ? new HashSet<>(r.getPermissions()) : new HashSet<>())
                .build();
    }
}
