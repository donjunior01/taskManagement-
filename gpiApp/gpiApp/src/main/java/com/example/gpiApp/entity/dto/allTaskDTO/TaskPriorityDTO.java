package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskPriorityDTO {
    private UUID priorityId;

    @NotBlank(message = "Priority name is required")
    @Size(min = 2, max = 50, message = "Priority name must be between 2 and 50 characters")
    private String priorityName;

    @NotNull(message = "Priority level is required")
    @Min(value = 1, message = "Priority level must be at least 1")
    @Max(value = 10, message = "Priority level cannot exceed 10")
    private Integer priorityLevel;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "Color code must be a valid hex color")
    private String colorCode;

    private Boolean isActive;
}