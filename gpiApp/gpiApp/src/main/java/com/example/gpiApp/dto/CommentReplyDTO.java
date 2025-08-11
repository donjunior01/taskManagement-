package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentReplyDTO {
    private Long replyId;
    private Long parentCommentId;
    private Long userId;
    private String userName;
    private String replyText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 