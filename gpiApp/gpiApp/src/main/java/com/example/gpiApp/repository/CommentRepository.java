package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    @Query("SELECT c FROM Comment c WHERE c.task.taskId = :taskId ORDER BY c.createdAt DESC")
    List<Comment> findByTaskTaskIdOrderByCreatedAtDesc(@Param("taskId") UUID taskId);
    
    @Query("SELECT c FROM Comment c WHERE c.user.userId = :userId")
    List<Comment> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT c FROM Comment c WHERE c.task.taskId = :taskId AND c.isPrivate = false ORDER BY c.createdAt DESC")
    List<Comment> findPublicCommentsByTask(@Param("taskId") UUID taskId);
    
    @Query("SELECT c FROM Comment c WHERE c.task.taskId = :taskId AND (c.isPrivate = false OR c.user.userId = :userId) ORDER BY c.createdAt DESC")
    List<Comment> findCommentsByTaskAndUser(@Param("taskId") UUID taskId, @Param("userId") UUID userId);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.task.taskId = :taskId")
    long countCommentsByTask(@Param("taskId") UUID taskId);
} 