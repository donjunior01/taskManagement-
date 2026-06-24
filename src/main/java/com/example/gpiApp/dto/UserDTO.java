package com.example.gpiApp.dto;

import com.example.gpiApp.entity.allUsers;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private allUsers.Role role;
    private String fullName;

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean isActive;

    private java.time.LocalDateTime createdAt;

    /** Number of projects this user works on (admins see the total number of projects). */
    private Long projectCount;

    /** Optional custom RBAC role assigned to this user (overrides base-role permissions). */
    private Long customRoleId;
    private String customRoleName;
}