package com.example.gpiApp.entity.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskProgressDTO {
    private UUID progressId;
    private UUID taskId;
    private UserSummaryDTO updatedBy;
    private BigDecimal previousPercentage;
    private BigDecimal currentPercentage;
    private String progressNotes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp updatedAt;

    private BigDecimal progressDifference;
}