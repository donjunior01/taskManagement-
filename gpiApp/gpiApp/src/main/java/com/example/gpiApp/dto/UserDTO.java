package com.example.gpiApp.dto;

import com.example.gpiApp.entity.allUsers;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePictureUrl;
    private allUsers.UserRole userRole;
    private allUsers.UserPost userPost;
    private Boolean isActive;
    private LocalDateTime emailVerifiedAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 