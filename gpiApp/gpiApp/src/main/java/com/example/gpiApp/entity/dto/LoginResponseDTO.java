package com.example.gpiApp.entity.dto;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.enumPackage.UserRole;
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
        this.role = allUsers.getUserRole().name();
//        this.redirectUrl = allUsers.getUserRole() == Role.ADMIN ? "/admin/dashboard" : "/project-manager/dashboard";
        if (allUsers.getUserRole() == UserRole.ADMIN) {
            this.redirectUrl = "/admin/adminDashboard";
        }else if (allUsers.getUserRole() == UserRole.USER) {
            this.redirectUrl = "/user/userDashboard";
        } else
            this.redirectUrl = "/project_manager/pmDashboard";
    }
} 