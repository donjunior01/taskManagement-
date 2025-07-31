package com.example.gpiApp.entity.dto;

import com.example.gpiApp.entity.enumPackage.UserPost;
import com.example.gpiApp.entity.enumPackage.UserRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.Timestamp;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponseDTO {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String userName;
    private String phone;
    private String profilePictureUrl;
    private UserRole userRole;
    private UserPost userPost;
    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp emailVerifiedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp lastLoginAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    // Additional fields for response
    private String fullName;
    private Boolean isEmailVerified;
    private Long daysSinceLastLogin;

    // Constructor for full name
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return null;
    }

    // Constructor for email verification status
    public Boolean getIsEmailVerified() {
        return emailVerifiedAt != null;
    }
}