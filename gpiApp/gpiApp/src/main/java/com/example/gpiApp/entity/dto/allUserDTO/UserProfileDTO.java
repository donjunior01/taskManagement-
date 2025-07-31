package com.example.gpiApp.entity.dto;

import com.example.gpiApp.entity.enumPackage.UserPost;
import com.example.gpiApp.entity.enumPackage.UserRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.security.Timestamp;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileDTO {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String userName;
    private String fullName;
    private String phone;
    private String profilePictureUrl;
    private UserRole userRole;
    private UserPost userPost;
    private Boolean isActive;
    private Boolean isEmailVerified;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp emailVerifiedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp lastLoginAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    // Statistics
    private UserStatsDTO stats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class UserStatsDTO {
        private Integer totalTasksCreated;
        private Integer totalTasksAssigned;
        private Integer totalTasksCompleted;
        private Integer totalComments;
        private Integer totalFilesUploaded;
        private Double completionRate;
        private Integer activeSessions;
    }

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
