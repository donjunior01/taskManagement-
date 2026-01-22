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
@Tag(name = "Deliverables", description = "Deliverable submission and review operations")
public class DeliverableController {
    
    private final DeliverableService deliverableService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all deliverables", description = "Retrieve paginated list of all deliverables")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved deliverables"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<PagedResponse<DeliverableDTO>> getAllDeliverables(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getAllDeliverables(page, size));
    }
    
    @Operation(summary = "Get deliverable by ID", description = "Retrieve a specific deliverable by its ID")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Deliverable found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Deliverable not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliverableDTO>> getDeliverableById(
            @Parameter(description = "Deliverable ID") @PathVariable Long id) {
        return ResponseEntity.ok(deliverableService.getDeliverableById(id));
    }
    
    @Operation(summary = "Submit deliverable", description = "Submit a new deliverable for a task")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Deliverable submitted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<DeliverableDTO>> createDeliverable(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Deliverable details") @RequestBody DeliverableRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.createDeliverable(request, userId));
    }
    
    @Operation(summary = "Review deliverable", description = "Review and approve/reject a deliverable")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Deliverable reviewed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Deliverable not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Manager or Admin role required")
    })
    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<DeliverableDTO>> reviewDeliverable(
            @Parameter(description = "Deliverable ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Review details") @RequestBody DeliverableReviewDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.reviewDeliverable(id, request, userId));
    }
    
    @Operation(summary = "Delete deliverable", description = "Delete a deliverable")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Deliverable deleted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Deliverable not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeliverable(
            @Parameter(description = "Deliverable ID") @PathVariable Long id) {
        return ResponseEntity.ok(deliverableService.deleteDeliverable(id));
    }
    
    @Operation(summary = "Get deliverables by task", description = "Retrieve all deliverables for a specific task")
    @GetMapping("/task/{taskId}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByTask(
            @Parameter(description = "Task ID") @PathVariable Long taskId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByTask(taskId, page, size));
    }
    
    @Operation(summary = "Get deliverables by user", description = "Retrieve all deliverables submitted by a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByUser(userId, page, size));
    }
    
    @Operation(summary = "Get deliverables by status", description = "Retrieve all deliverables with a specific status")
    @GetMapping("/status/{status}")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getDeliverablesByStatus(
            @Parameter(description = "Deliverable status") @PathVariable Deliverable.DeliverableStatus status,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deliverableService.getDeliverablesByStatus(status, page, size));
    }
    
    @Operation(summary = "Get pending deliverables", description = "Retrieve pending deliverables for the current manager")
    @GetMapping("/pending")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getPendingDeliverables(
            Authentication authentication,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(deliverableService.getPendingDeliverablesByManager(userId, page, size));
    }
    
    @Operation(summary = "Get my deliverables", description = "Retrieve deliverables submitted by the current user")
    @GetMapping("/my")
    public ResponseEntity<PagedResponse<DeliverableDTO>> getMyDeliverables(
            Authentication authentication,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
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

