package com.example.gpiApp.entity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class UserLoginRequestDTO {
    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

    private Boolean rememberMe = false;
}