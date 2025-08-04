package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "comment_replies")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentReply {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "reply_id")
    private UUID replyId;

    @ManyToOne
    @JoinColumn(name = "parent_comment_id", nullable = false)
    private Comment parentComment;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @Column(name = "reply_text", columnDefinition = "TEXT", nullable = false)
    private String replyText;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 