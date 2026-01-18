package com.example.gpiApp.dto;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.allUsers.Role;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String email;
    private String role;
    private String redirectUrl;

    public LoginResponse(String token, allUsers allUsers) {
        this.token = token;
        this.email = allUsers.getEmail();
        this.role = allUsers.getRole().name();
//        this.redirectUrl = allUsers.getRole() == Role.ADMIN ? "/admin/dashboard" : "/project-manager/dashboard";
        if (allUsers.getRole() == Role.ADMIN) {
            this.redirectUrl = "/admin/adminDashboard";
        }else if (allUsers.getRole() == Role.USER) {
            this.redirectUrl = "/user/userDashboard";
        } else
            this.redirectUrl = "/project_manager/pmDashboard";
    }
} 