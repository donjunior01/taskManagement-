package com.example.gpiApp.dto;

import com.example.gpiApp.entity.Deliverable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliverableRequestDTO {
    @NotNull(message = "Task ID is required")
    private Long taskId;
    
    @NotBlank(message = "File name is required")
    private String fileName;
    
    @NotBlank(message = "File URL is required")
    private String fileUrl;
    
    private Long fileSize;
}

