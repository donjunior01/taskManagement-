package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentReplyDTO {
    private UUID replyId;
    private UUID parentCommentId;
    private UUID userId;
    private String userName;
    private String replyText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 