package com.example.gpiApp.service;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PasswordResetRequestDTO;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.PasswordResetRequest;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.PasswordResetRequestRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    
    private final PasswordResetRequestRepository passwordResetRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    @Transactional
    public ApiResponse<PasswordResetRequestDTO> createPasswordResetRequest(String email, String reason) {
        // Check if user exists
        allUsers user = userRepository.findByEmail(email)
                .orElse(null);
        
        if (user == null) {
            // Don't reveal if user exists for security
            return ApiResponse.success("If the email exists, a password reset request has been sent to the administrator", null);
        }
        
        // Check for existing pending request
        passwordResetRequestRepository.findByEmailAndStatus(email, PasswordResetRequest.RequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw new RuntimeException("A pending password reset request already exists for this email");
                });
        
        PasswordResetRequest request = PasswordResetRequest.builder()
                .email(email)
                .reason(reason)
                .status(PasswordResetRequest.RequestStatus.PENDING)
                .user(user)
                .build();
        
        PasswordResetRequest savedRequest = passwordResetRequestRepository.save(request);
        
        // Notify all admins
        List<allUsers> admins = userRepository.findByRole(allUsers.Role.ADMIN);
        for (allUsers admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "Password Reset Request",
                String.format("User %s (%s) has requested a password reset. Reason: %s", 
                    user.getFirstName() + " " + user.getLastName(), 
                    email,
                    reason != null && !reason.isEmpty() ? reason : "No reason provided"),
                Notification.NotificationType.SYSTEM,
                savedRequest.getId(),
                "PASSWORD_RESET_REQUEST"
            );
        }
        
        return ApiResponse.success("Password reset request submitted successfully. An administrator will review your request.", convertToDTO(savedRequest));
    }
    
    @Transactional(readOnly = true)
    public List<PasswordResetRequestDTO> getPendingRequests() {
        List<PasswordResetRequest> requests = passwordResetRequestRepository.findByStatusOrderByRequestedAtDesc(PasswordResetRequest.RequestStatus.PENDING);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ApiResponse<PasswordResetRequestDTO> approveRequest(Long requestId, Long adminId) {
        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Password reset request not found"));
        
        allUsers admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        request.setStatus(PasswordResetRequest.RequestStatus.APPROVED);
        request.setProcessedBy(admin);
        request.setProcessedAt(java.time.LocalDateTime.now());
        
        PasswordResetRequest savedRequest = passwordResetRequestRepository.save(request);
        
        // Notify user
        if (request.getUser() != null) {
            notificationService.createNotification(
                request.getUser().getId(),
                "Password Reset Approved",
                "Your password reset request has been approved. Please contact your administrator for the new password.",
                Notification.NotificationType.SYSTEM,
                savedRequest.getId(),
                "PASSWORD_RESET_REQUEST"
            );
        }
        
        return ApiResponse.success("Password reset request approved", convertToDTO(savedRequest));
    }
    
    @Transactional
    public ApiResponse<PasswordResetRequestDTO> rejectRequest(Long requestId, Long adminId) {
        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Password reset request not found"));
        
        allUsers admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        request.setStatus(PasswordResetRequest.RequestStatus.REJECTED);
        request.setProcessedBy(admin);
        request.setProcessedAt(java.time.LocalDateTime.now());
        
        PasswordResetRequest savedRequest = passwordResetRequestRepository.save(request);
        
        // Notify user
        if (request.getUser() != null) {
            notificationService.createNotification(
                request.getUser().getId(),
                "Password Reset Request Rejected",
                "Your password reset request has been rejected. Please contact support for assistance.",
                Notification.NotificationType.SYSTEM,
                savedRequest.getId(),
                "PASSWORD_RESET_REQUEST"
            );
        }
        
        return ApiResponse.success("Password reset request rejected", convertToDTO(savedRequest));
    }
    
    private PasswordResetRequestDTO convertToDTO(PasswordResetRequest request) {
        return PasswordResetRequestDTO.builder()
                .id(request.getId())
                .email(request.getEmail())
                .reason(request.getReason())
                .status(request.getStatus())
                .userId(request.getUser() != null ? request.getUser().getId() : null)
                .userName(request.getUser() != null ? 
                        request.getUser().getFirstName() + " " + request.getUser().getLastName() : null)
                .processedById(request.getProcessedBy() != null ? request.getProcessedBy().getId() : null)
                .processedByName(request.getProcessedBy() != null ? 
                        request.getProcessedBy().getFirstName() + " " + request.getProcessedBy().getLastName() : null)
                .requestedAt(request.getRequestedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }
}

