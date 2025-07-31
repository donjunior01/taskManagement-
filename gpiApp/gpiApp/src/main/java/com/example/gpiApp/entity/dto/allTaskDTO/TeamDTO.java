package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeamDTO {
    private UUID teamId;

    @NotBlank(message = "Team name is required")
    @Size(min = 2, max = 100, message = "Team name must be between 2 and 100 characters")
    private String teamName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private UUID teamLeaderId;
    private String teamLeaderName;
    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp expiresAt;

    private String timeAgo;
    private Boolean isExpired;
    private Integer memberCount;
    private Integer activeProjectsCount;
}
