package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Deliverable;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliverableReviewDTO {
    @NotNull(message = "Status is required")
    private Deliverable.DeliverableStatus status;
    
    private String comments;
}

