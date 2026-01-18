package com.example.gpiApp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequestDTO {
    private Long recipientId;  // For direct messages (optional if projectId is set)
    
    private Long projectId;    // For project team messages (optional if recipientId is set)
    
    private String subject;    // Optional subject line
    
    @NotBlank(message = "Message content is required")
    private String content;
}

