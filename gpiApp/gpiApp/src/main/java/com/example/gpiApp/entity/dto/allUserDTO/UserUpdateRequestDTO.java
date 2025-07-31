package com.example.gpiApp.entity.dto;

import com.example.gpiApp.entity.enumPackage.UserPost;
import com.example.gpiApp.entity.enumPackage.UserRole;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserUpdateRequestDTO {
    @Email(message = "Email should be valid")
    private String email;

    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    private String userName;

    @Size(max = 15, message = "Phone number cannot exceed 15 characters")
    private String phone;

    private String profilePictureUrl;

    private UserRole userRole;

    private UserPost userPost;

    private Boolean isActive;
}
