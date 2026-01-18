package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.ForgotPasswordRequest;
import com.example.gpiApp.dto.PasswordResetRequestDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.PasswordResetRequest;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.PasswordResetRequestRepository;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    
    private final PasswordResetRequestRepository passwordResetRequestRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public ApiResponse<String> requestPasswordReset(ForgotPasswordRequest request) {
        Optional<allUsers> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            // Security: Don't reveal if email exists
            return ApiResponse.success("If the email exists, a password reset request has been sent.");
        }
        
        allUsers user = userOpt.get();
        
        // Check if there's already a pending request
        List<PasswordResetRequest> pendingRequests = passwordResetRequestRepository
                .findByUserIdAndStatusOrderByRequestedAtDesc(user.getId(), PasswordResetRequest.ResetStatus.PENDING);
        
        if (!pendingRequests.isEmpty() && pendingRequests.get(0).getExpiresAt().isAfter(LocalDateTime.now())) {
            return ApiResponse.success("A password reset request is already pending. Please wait or contact administrator.");
        }
        
        // Create new password reset request
        PasswordResetRequest resetRequest = PasswordResetRequest.builder()
                .user(user)
                .reason(request.getReason())
                .build();
        
        passwordResetRequestRepository.save(resetRequest);
        
        // TODO: Log the activity when ActivityLogService is properly configured
        // Notify admins
        // TODO: Notify admins when NotificationService is properly configured
        
        return ApiResponse.success("Password reset request submitted successfully. An administrator will review your request.");
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<PasswordResetRequestDTO> getPendingRequests(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        Page<PasswordResetRequest> requestPage = passwordResetRequestRepository.findByStatus(
                PasswordResetRequest.ResetStatus.PENDING, pageable);
        
        List<PasswordResetRequestDTO> dtos = requestPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(dtos, page, size, requestPage.getTotalElements(),
                requestPage.getTotalPages(), requestPage.isFirst(), requestPage.isLast());
    }
    
    @Transactional
    public ApiResponse<String> approvePasswordReset(Long requestId, Long adminId) {
        Optional<PasswordResetRequest> resetReqOpt = passwordResetRequestRepository.findById(requestId);
        
        if (resetReqOpt.isEmpty()) {
            return ApiResponse.error("Password reset request not found");
        }
        
        PasswordResetRequest resetRequest = resetReqOpt.get();
        allUsers admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        resetRequest.setStatus(PasswordResetRequest.ResetStatus.APPROVED);
        resetRequest.setApprovedAt(LocalDateTime.now());
        resetRequest.setReviewedBy(admin);
        
        passwordResetRequestRepository.save(resetRequest);
        
        // TODO: Notify user when NotificationService is properly configured
        
        return ApiResponse.success("Password reset request approved successfully.");
    }
    
    @Transactional
    public ApiResponse<String> rejectPasswordReset(Long requestId, Long adminId, String reason) {
        Optional<PasswordResetRequest> resetReqOpt = passwordResetRequestRepository.findById(requestId);
        
        if (resetReqOpt.isEmpty()) {
            return ApiResponse.error("Password reset request not found");
        }
        
        PasswordResetRequest resetRequest = resetReqOpt.get();
        allUsers admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        resetRequest.setStatus(PasswordResetRequest.ResetStatus.REJECTED);
        resetRequest.setReviewedBy(admin);
        resetRequest.setReason(reason);
        
        passwordResetRequestRepository.save(resetRequest);
        
        // TODO: Notify user when NotificationService is properly configured
        
        return ApiResponse.success("Password reset request rejected successfully.");
    }
    
    @Transactional(readOnly = true)
    public long getPendingRequestCount() {
        Page<PasswordResetRequest> page = passwordResetRequestRepository.findByStatus(
                PasswordResetRequest.ResetStatus.PENDING,
                PageRequest.of(0, 1)
        );
        return page.getTotalElements();
    }
    
    private PasswordResetRequestDTO convertToDTO(PasswordResetRequest request) {
        return PasswordResetRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .username(request.getUser().getUsername())
                .email(request.getUser().getEmail())
                .status(request.getStatus())
                .reason(request.getReason())
                .requestedAt(request.getRequestedAt())
                .approvedAt(request.getApprovedAt())
                .expiresAt(request.getExpiresAt())
                .build();
    }
}
