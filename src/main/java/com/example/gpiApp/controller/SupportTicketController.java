package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.SupportTicketDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/support-tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<PagedResponse<SupportTicketDTO>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ticketService.getAllTickets(page, size));
    }

    @GetMapping("/my")
    public ResponseEntity<PagedResponse<SupportTicketDTO>> getMyTickets(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SupportTicketDTO>> createTicket(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not authenticated"));
        }
        
        String subject = request.get("subject");
        String description = request.get("description");
        String priority = request.get("priority");
        
        return ResponseEntity.ok(ticketService.createTicket(userId, subject, description, priority));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<SupportTicketDTO>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        Long assignedToId = request.get("assignedToId");
        return ResponseEntity.ok(ticketService.assignTicket(id, assignedToId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.deleteTicket(id));
    }

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

