package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private Long id;
    private String name;
    private String description;
    private boolean system;
    private Set<String> permissions;
    /** For built-in roles, the base access level (ADMIN/PROJECT_MANAGER/USER); null for custom roles. */
    private String baseRole;
}
