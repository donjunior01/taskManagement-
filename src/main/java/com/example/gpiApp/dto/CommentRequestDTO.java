package com.example.gpiApp.dto;

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
public class CommentRequestDTO {
    @NotBlank(message = "Comment content is required")
    private String content;
    
    @NotNull(message = "Task ID is required")
    private Long taskId;
    
    private String attachmentUrl;
    
    private String attachmentName;
}

