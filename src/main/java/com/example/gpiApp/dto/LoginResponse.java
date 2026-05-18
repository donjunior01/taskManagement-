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