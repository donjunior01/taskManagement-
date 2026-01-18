package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.Deliverable;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.DeliverableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deliverables")
@RequiredArgsConstructor
@Tag(name = "Deliverables", description = "Deliverable submission and review")
public class DeliverableController {
    
    private final DeliverableService deliverableService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<PagedResponse<DeliverableDTO>> getAllDeliverables(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getAllDeliverables(page, size));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliverableDTO>> getDeliverableById(@PathVariable Long id) {
        return ResponseEntity.ok(deliverableService.getDeliverableById(id));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<DeliverableDTO>> createDeliverable(
            @RequestBody DeliverableRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.createDeliverable(request, userId));
    }
    
    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<DeliverableDTO>> reviewDeliverable(
            @PathVariable Long id,
            @RequestBody DeliverableReviewDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.reviewDeliverable(id, request, userId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeliverable(@PathVariable Long id) {
        return ResponseEntity.ok(deliverableService.deleteDeliverable(id));
    }
    
    @GetMapping("/task/{taskId}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByTask(
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByTask(taskId, page, size));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByUser(userId, page, size));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByStatus(
            @PathVariable Deliverable.DeliverableStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByStatus(status, page, size));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getPendingDeliverables(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.getPendingDeliverablesByManager(userId, page, size));
    }
    
    @GetMapping("/my")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getMyDeliverables(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(deliverableService.getDeliverablesByUser(userId, page, size));
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

