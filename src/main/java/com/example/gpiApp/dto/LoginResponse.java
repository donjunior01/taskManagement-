package com.example.gpiApp.dto;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.allUsers.Role;
import lombok.Data;
import java.util.List;

@Data
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String role;
    private List<String> roles;
    private String redirectUrl;
    /** True when policy requires this (admin) account to enrol in 2FA before continuing. */
    private boolean mfaSetupRequired;
    /** True when the password has exceeded the rotation policy and must be changed before continuing. */
    private boolean passwordChangeRequired;

    public LoginResponse(String token, allUsers allUsers) {
        this.token = token;
        this.id = allUsers.getId();
        this.email = allUsers.getEmail();
        this.role = allUsers.getRole().name();
        this.roles = List.of("ROLE_" + allUsers.getRole().name());
        if (allUsers.getRole() == Role.ADMIN) {
            this.redirectUrl = "/admin/adminDashboard";
        } else if (allUsers.getRole() == Role.USER) {
            this.redirectUrl = "/user/userDashboard";
        } else {
            this.redirectUrl = "/project-manager/pmDashboard";
        }
    }
} 