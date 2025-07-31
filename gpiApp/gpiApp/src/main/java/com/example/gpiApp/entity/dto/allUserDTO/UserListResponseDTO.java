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
public class UserListResponseDTO {
    private List<UserSummaryDTO> users;
    private PaginationInfo pagination;
    private FilterInfo filters;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class UserSummaryDTO {
        private UUID userId;
        private String email;
        private String firstName;
        private String lastName;
        private String userName;
        private String fullName;
        private UserRole userRole;
        private UserPost userPost;
        private Boolean isActive;
        private Boolean isEmailVerified;
        private String profilePictureUrl;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private Timestamp lastLoginAt;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private Timestamp createdAt;

        // Constructor for full name
        public String getFullName() {
            if (firstName != null && lastName != null) {
                return firstName + " " + lastName;
            }
            return null;
        }

        // Constructor for email verification status
        public Boolean getIsEmailVerified() {
            return lastLoginAt != null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class PaginationInfo {
        private Integer currentPage;
        private Integer totalPages;
        private Integer pageSize;
        private Long totalElements;
        private Boolean hasNext;
        private Boolean hasPrevious;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class FilterInfo {
        private UserRole userRole;
        private UserPost userPost;
        private Boolean isActive;
        private String searchTerm;
        private String sortBy;
        private String sortDirection;
    }
}