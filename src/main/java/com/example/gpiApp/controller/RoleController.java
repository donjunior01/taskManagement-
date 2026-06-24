package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.RoleDTO;
import com.example.gpiApp.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Custom roles & permissions management — requires the role.manage permission (admins are super-users). */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('role.manage')")
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, String>>> catalog() {
        return ResponseEntity.ok(roleService.permissionCatalog());
    }

    @GetMapping
    public ResponseEntity<List<RoleDTO>> list() {
        return ResponseEntity.ok(roleService.listForCurrentTenant());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleDTO>> create(@RequestBody RoleDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Role created", roleService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDTO>> update(@PathVariable Long id, @RequestBody RoleDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Role updated", roleService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Role deleted", null));
    }

    @PostMapping("/{roleId}/assign/{userId}")
    public ResponseEntity<ApiResponse<Void>> assign(@PathVariable Long roleId, @PathVariable Long userId) {
        roleService.assignToUser(userId, roleId);
        return ResponseEntity.ok(ApiResponse.success("Role assigned", null));
    }

    @DeleteMapping("/assign/{userId}")
    public ResponseEntity<ApiResponse<Void>> unassign(@PathVariable Long userId) {
        roleService.assignToUser(userId, null);
        return ResponseEntity.ok(ApiResponse.success("Custom role removed", null));
    }
}
