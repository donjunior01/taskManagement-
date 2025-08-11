package com.example.gpiApp.repository;

import com.example.gpiApp.entity.CommentReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {
    @Query("SELECT cr FROM CommentReply cr WHERE cr.parentComment.commentId = :commentId ORDER BY cr.createdAt ASC")
    List<CommentReply> findByParentCommentCommentIdOrderByCreatedAtAsc(@Param("commentId") Long commentId);
    
    @Query("SELECT cr FROM CommentReply cr WHERE cr.user.userId = :userId")
    List<CommentReply> findByUserId(@Param("userId") Long userId);
} 