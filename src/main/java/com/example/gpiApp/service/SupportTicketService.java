package com.example.gpiApp.service;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.dto.SupportTicketDTO;
import com.example.gpiApp.entity.SupportTicket;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.SupportTicketRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;

    public PagedResponse<SupportTicketDTO> getAllTickets(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicket> ticketPage = ticketRepository.findAll(pageable);
        
        List<SupportTicketDTO> dtos = ticketPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(
                dtos,
                ticketPage.getNumber(),
                ticketPage.getSize(),
                ticketPage.getTotalElements(),
                ticketPage.getTotalPages(),
                ticketPage.isFirst(),
                ticketPage.isLast()
        );
    }

    public PagedResponse<SupportTicketDTO> getTicketsByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicket> ticketPage = ticketRepository.findByUserId(userId, pageable);
        
        List<SupportTicketDTO> dtos = ticketPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(
                dtos,
                ticketPage.getNumber(),
                ticketPage.getSize(),
                ticketPage.getTotalElements(),
                ticketPage.getTotalPages(),
                ticketPage.isFirst(),
                ticketPage.isLast()
        );
    }

    public ApiResponse<SupportTicketDTO> getTicketById(Long id) {
        return ticketRepository.findById(id)
                .map(ticket -> ApiResponse.success("Ticket retrieved", convertToDTO(ticket)))
                .orElse(ApiResponse.error("Ticket not found"));
    }

    @Transactional
    public ApiResponse<SupportTicketDTO> createTicket(Long userId, String subject, String description, String priority) {
        allUsers user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("User not found");
        }

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .subject(subject)
                .description(description)
                .priority(priority != null ? SupportTicket.Priority.valueOf(priority) : SupportTicket.Priority.MEDIUM)
                .status(SupportTicket.Status.OPEN)
                .build();

        SupportTicket saved = ticketRepository.save(ticket);
        return ApiResponse.success("Ticket created successfully", convertToDTO(saved));
    }

    @Transactional
    public ApiResponse<SupportTicketDTO> updateTicketStatus(Long id, String status) {
        return ticketRepository.findById(id)
                .map(ticket -> {
                    ticket.setStatus(SupportTicket.Status.valueOf(status));
                    if (status.equals("RESOLVED") || status.equals("CLOSED")) {
                        ticket.setResolvedAt(LocalDateTime.now());
                    }
                    SupportTicket saved = ticketRepository.save(ticket);
                    return ApiResponse.success("Ticket status updated", convertToDTO(saved));
                })
                .orElse(ApiResponse.error("Ticket not found"));
    }

    @Transactional
    public ApiResponse<SupportTicketDTO> assignTicket(Long id, Long assignedToId) {
        return ticketRepository.findById(id)
                .map(ticket -> {
                    allUsers assignedTo = userRepository.findById(assignedToId).orElse(null);
                    ticket.setAssignedTo(assignedTo);
                    if (ticket.getStatus() == SupportTicket.Status.OPEN) {
                        ticket.setStatus(SupportTicket.Status.IN_PROGRESS);
                    }
                    SupportTicket saved = ticketRepository.save(ticket);
                    return ApiResponse.success("Ticket assigned successfully", convertToDTO(saved));
                })
                .orElse(ApiResponse.error("Ticket not found"));
    }

    @Transactional
    public ApiResponse<Void> deleteTicket(Long id) {
        if (ticketRepository.existsById(id)) {
            ticketRepository.deleteById(id);
            return ApiResponse.success("Ticket deleted", null);
        }
        return ApiResponse.error("Ticket not found");
    }

    public long countOpenTickets() {
        return ticketRepository.countByStatus(SupportTicket.Status.OPEN);
    }

    public long countInProgressTickets() {
        return ticketRepository.countByStatus(SupportTicket.Status.IN_PROGRESS);
    }

    private SupportTicketDTO convertToDTO(SupportTicket ticket) {
        return SupportTicketDTO.builder()
                .id(ticket.getId())
                .userId(ticket.getUser().getId())
                .userName(ticket.getUser().getFirstName() + " " + ticket.getUser().getLastName())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? 
                        ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName() : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .build();
    }
}

