package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comment management operations")
public class CommentController {
    
    private final CommentService commentService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all comments", description = "Retrieve paginated list of all comments")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved comments"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<PagedResponse<CommentDTO>> getAllComments(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentService.getAllComments(page, size));
    }
    
    @Operation(summary = "Get comment by ID", description = "Retrieve a specific comment by its ID")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Comment not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentDTO>> getCommentById(
            @Parameter(description = "Comment ID") @PathVariable Long id) {
        return ResponseEntity.ok(commentService.getCommentById(id));
    }
    
    @Operation(summary = "Create comment", description = "Add a new comment to a task")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<CommentDTO>> createComment(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Comment details") @RequestBody CommentRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(commentService.createComment(request, userId));
    }
    
    @Operation(summary = "Update comment", description = "Update an existing comment")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment updated successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Comment not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Can only update own comments")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentDTO>> updateComment(
            @Parameter(description = "Comment ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Updated comment details") @RequestBody CommentRequestDTO request) {
        return ResponseEntity.ok(commentService.updateComment(id, request));
    }
    
    @Operation(summary = "Delete comment", description = "Delete a comment")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment deleted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Comment not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Can only delete own comments")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @Parameter(description = "Comment ID") @PathVariable Long id) {
        return ResponseEntity.ok(commentService.deleteComment(id));
    }
    
    @Operation(summary = "Get comments by task", description = "Retrieve all comments for a specific task")
    @GetMapping("/task/{taskId}")
    public ResponseEntity<PagedResponse<CommentDTO>> getCommentsByTask(
            @Parameter(description = "Task ID") @PathVariable Long taskId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentService.getCommentsByTask(taskId, page, size));
    }
    
    @Operation(summary = "Get comments by user", description = "Retrieve all comments created by a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<CommentDTO>> getCommentsByUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentService.getCommentsByUser(userId, page, size));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}

