package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long commentId;
    private Long taskId;
    private String taskTitle;
    private Long userId;
    private String userName;
    private String commentText;
    private Boolean isPrivate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentReplyDTO> replies;
    private Integer replyCount;
} 