package com.example.gpiApp.entity.dto.commonDTO;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSummaryDTO {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String userName;
    private String fullName;
    private UserRole userRole;
    private UserPost userPost;
    private String profilePictureUrl;
    private Boolean isActive;

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return userName;
    }
}
