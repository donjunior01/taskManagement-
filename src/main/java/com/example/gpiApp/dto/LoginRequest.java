package com.example.gpiApp.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String email;
    private String password;
    private String code;   // optional TOTP code when 2FA is enabled
}