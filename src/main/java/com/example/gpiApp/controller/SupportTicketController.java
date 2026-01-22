package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.SupportTicketDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/support-tickets")
@RequiredArgsConstructor
@Tag(name = "Support Tickets", description = "Support ticket management operations")
public class SupportTicketController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepository;

    @Operation(summary = "Get all support tickets", description = "Retrieve paginated list of all support tickets")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved tickets"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<PagedResponse<SupportTicketDTO>> getAllTickets(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ticketService.getAllTickets(page, size));
    }

    @Operation(summary = "Get my tickets", description = "Retrieve tickets created by the current user")
    @GetMapping("/my")
    public ResponseEntity<PagedResponse<SupportTicketDTO>> getMyTickets(
            Authentication authentication,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId, page, size));
    }

    @Operation(summary = "Get ticket by ID", description = "Retrieve a specific support ticket by its ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> getTicketById(
            @Parameter(description = "Ticket ID") @PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @Operation(summary = "Create support ticket", description = "Create a new support ticket")
    @PostMapping
    public ResponseEntity<ApiResponse<SupportTicketDTO>> createTicket(
            Authentication authentication,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Ticket details") @RequestBody Map<String, String> request) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not authenticated"));
        }
        
        String subject = request.get("subject");
        String description = request.get("description");
        String priority = request.get("priority");
        
        return ResponseEntity.ok(ticketService.createTicket(userId, subject, description, priority));
    }

    @Operation(summary = "Update ticket status", description = "Update the status of a support ticket")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> updateTicketStatus(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Status update") @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, status));
    }

    @Operation(summary = "Assign ticket", description = "Assign a support ticket to a user")
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> assignTicket(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Assignment details") @RequestBody Map<String, Long> request) {
        Long assignedToId = request.get("assignedToId");
        return ResponseEntity.ok(ticketService.assignTicket(id, assignedToId));
    }

    @Operation(summary = "Delete ticket", description = "Delete a support ticket")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(
            @Parameter(description = "Ticket ID") @PathVariable Long id) {
        return ResponseEntity.ok(ticketService.deleteTicket(id));
    }

    @Operation(summary = "Count open tickets", description = "Get the count of open support tickets")
    @GetMapping("/count/open")
    public ResponseEntity<ApiResponse<Long>> countOpenTickets() {
        return ResponseEntity.ok(ApiResponse.success("Open tickets count", ticketService.countOpenTickets()));
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

