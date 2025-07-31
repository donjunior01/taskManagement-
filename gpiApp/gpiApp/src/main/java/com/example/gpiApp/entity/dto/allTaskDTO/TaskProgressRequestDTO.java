package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class TaskProgressRequestDTO {
    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotNull(message = "Current percentage is required")
    @DecimalMin(value = "0.0", message = "Progress percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Progress percentage cannot exceed 100")
    private BigDecimal currentPercentage;

    @Size(max = 1000, message = "Progress notes cannot exceed 1000 characters")
    private String progressNotes;
}