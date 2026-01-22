package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Long id;
    private String content;
    private Long taskId;
    private String taskName;
    private Long userId;
    private String userName;
    private String attachmentUrl;
    private String attachmentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

