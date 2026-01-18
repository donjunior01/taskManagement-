package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Comment;
import com.example.gpiApp.repository.CommentRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    
    @Transactional(readOnly = true)
    public PagedResponse<CommentDTO> getAllComments(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> commentPage = commentRepository.findAll(pageable);
        
        List<CommentDTO> commentDTOs = commentPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(commentDTOs, commentPage.getNumber(), commentPage.getSize(),
                commentPage.getTotalElements(), commentPage.getTotalPages(),
                commentPage.isFirst(), commentPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<CommentDTO> getCommentById(Long id) {
        return commentRepository.findById(id)
                .map(comment -> ApiResponse.success("Comment retrieved successfully", convertToDTO(comment)))
                .orElse(ApiResponse.error("Comment not found"));
    }
    
    @Transactional
    public ApiResponse<CommentDTO> createComment(CommentRequestDTO request, Long userId) {
        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setAttachmentUrl(request.getAttachmentUrl());
        comment.setAttachmentName(request.getAttachmentName());
        
        taskRepository.findById(request.getTaskId())
                .ifPresent(comment::setTask);
        
        userRepository.findById(userId)
                .ifPresent(comment::setUser);
        
        Comment savedComment = commentRepository.save(comment);
        
        // Log activity
        userRepository.findById(userId).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.COMMENT_ADDED,
                "Comment added to task",
                user,
                "COMMENT",
                savedComment.getId(),
                null
            )
        );
        
        return ApiResponse.success("Comment created successfully", convertToDTO(savedComment));
    }
    
    @Transactional
    public ApiResponse<CommentDTO> updateComment(Long id, CommentRequestDTO request) {
        return commentRepository.findById(id)
                .map(comment -> {
                    comment.setContent(request.getContent());
                    comment.setAttachmentUrl(request.getAttachmentUrl());
                    comment.setAttachmentName(request.getAttachmentName());
                    Comment updatedComment = commentRepository.save(comment);
                    return ApiResponse.success("Comment updated successfully", convertToDTO(updatedComment));
                })
                .orElse(ApiResponse.error("Comment not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteComment(Long id) {
        return commentRepository.findById(id)
                .map(comment -> {
                    commentRepository.delete(comment);
                    return ApiResponse.<Void>success("Comment deleted successfully", null);
                })
                .orElse(ApiResponse.error("Comment not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<CommentDTO> getCommentsByTask(Long taskId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> commentPage = commentRepository.findByTaskId(taskId, pageable);
        
        List<CommentDTO> commentDTOs = commentPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(commentDTOs, commentPage.getNumber(), commentPage.getSize(),
                commentPage.getTotalElements(), commentPage.getTotalPages(),
                commentPage.isFirst(), commentPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<CommentDTO> getCommentsByUser(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> commentPage = commentRepository.findByUserId(userId, pageable);
        
        List<CommentDTO> commentDTOs = commentPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(commentDTOs, commentPage.getNumber(), commentPage.getSize(),
                commentPage.getTotalElements(), commentPage.getTotalPages(),
                commentPage.isFirst(), commentPage.isLast());
    }
    
    private CommentDTO convertToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .taskId(comment.getTask() != null ? comment.getTask().getId() : null)
                .taskName(comment.getTask() != null ? comment.getTask().getName() : null)
                .userId(comment.getUser() != null ? comment.getUser().getId() : null)
                .userName(comment.getUser() != null ? 
                        comment.getUser().getFirstName() + " " + comment.getUser().getLastName() : null)
                .attachmentUrl(comment.getAttachmentUrl())
                .attachmentName(comment.getAttachmentName())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}

