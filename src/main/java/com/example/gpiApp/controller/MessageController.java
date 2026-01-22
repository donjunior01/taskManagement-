package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Internal messaging system")
public class MessageController {
    
    private final MessageService messageService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<PagedResponse<MessageDTO>> getAllMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(messageService.getAllMessages(page, size));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MessageDTO>> getMessageById(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.getMessageById(id));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessage(
            @RequestBody MessageRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.sendMessage(request, userId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.deleteMessage(id));
    }
    
    @GetMapping("/sent")
    public ResponseEntity<PagedResponse<MessageDTO>> getSentMessages(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getSentMessages(userId, page, size));
    }
    
    @GetMapping("/received")
    public ResponseEntity<PagedResponse<MessageDTO>> getReceivedMessages(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getReceivedMessages(userId, page, size));
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<MessageDTO>> getUnreadMessages(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getUnreadMessages(userId));
    }
    
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getUnreadCount(userId));
    }
    
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getConversations(
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not authenticated"));
        }
        return ResponseEntity.ok(messageService.getConversations(userId));
    }
    
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getConversation(
            @PathVariable Long otherUserId,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getDirectConversation(userId, otherUserId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getDirectMessages(
            @PathVariable Long userId,
            Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.getDirectConversation(currentUserId, userId));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getProjectMessages(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(messageService.getProjectMessages(projectId));
    }
    
    @PutMapping("/read/{senderId}")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long senderId,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(messageService.markAsRead(userId, senderId));
    }
    
    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markSingleMessageAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.markSingleAsRead(id));
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

