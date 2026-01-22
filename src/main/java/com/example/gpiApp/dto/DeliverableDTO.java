package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Deliverable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliverableDTO {
    private Long id;
    private Long taskId;
    private String taskName;
    private Long submittedById;
    private String submittedByName;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Deliverable.DeliverableStatus status;
    private String comments;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

