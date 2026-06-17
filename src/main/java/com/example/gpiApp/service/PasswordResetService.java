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
    private final com.example.gpiApp.repository.UserService userService;

    @Transactional
    public ApiResponse<PasswordResetRequestDTO> createPasswordResetRequest(String email, String reason) {
        if (email == null || email.isBlank()) {
            return ApiResponse.error("Veuillez saisir une adresse e-mail.");
        }
        allUsers user = userRepository.findByEmail(email).orElse(null);

        // Per requirement: tell the user clearly whether the account exists, and only notify
        // admins when it does.
        if (user == null) {
            return ApiResponse.error("Aucun compte n'est associé à cette adresse e-mail.");
        }

        // A pending request already exists → don't create a duplicate.
        if (passwordResetRequestRepository.findByEmailAndStatus(email, PasswordResetRequest.RequestStatus.PENDING).isPresent()) {
            return ApiResponse.success("Une demande de réinitialisation est déjà en attente pour cet e-mail. Un administrateur la traitera.", null);
        }

        PasswordResetRequest request = PasswordResetRequest.builder()
                .email(email)
                .reason(reason)
                .status(PasswordResetRequest.RequestStatus.PENDING)
                .user(user)
                .build();

        PasswordResetRequest savedRequest = passwordResetRequestRepository.save(request);

        // Notify all admins so they can approve the reset.
        List<allUsers> admins = userRepository.findByRole(allUsers.Role.ADMIN);
        for (allUsers admin : admins) {
            boolean hasReason = reason != null && !reason.isEmpty();
            notificationService.createNotification(
                admin.getId(),
                "Demande de réinitialisation de mot de passe",
                String.format("%s (%s) a demandé la réinitialisation de son mot de passe.%s",
                    user.getFirstName() + " " + user.getLastName(),
                    email,
                    hasReason ? " Motif : " + reason : ""),
                Notification.NotificationType.SYSTEM,
                savedRequest.getId(),
                "PASSWORD_RESET_REQUEST",
                hasReason ? "pwdResetRequestReason" : "pwdResetRequest",
                hasReason
                    ? java.util.Map.of("name", user.getFirstName() + " " + user.getLastName(), "email", email, "reason", reason)
                    : java.util.Map.of("name", user.getFirstName() + " " + user.getLastName(), "email", email)
            );
        }

        return ApiResponse.success(
            "Votre demande a été envoyée à l'administrateur. Une fois approuvée, vous recevrez votre nouveau mot de passe par e-mail.",
            convertToDTO(savedRequest));
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

        // Actually reset the password to a policy-compliant temporary value and e-mail it to the user.
        // (resetUserPassword also posts an in-app notification and sends the e-mail.)
        if (request.getUser() != null) {
            try {
                userService.resetUserPassword(request.getUser().getId());
            } catch (Exception e) {
                return ApiResponse.error("La demande a été approuvée mais la réinitialisation a échoué : " + e.getMessage());
            }
        }

        return ApiResponse.success("Demande approuvée. Un nouveau mot de passe a été envoyé à l'utilisateur par e-mail.", convertToDTO(savedRequest));
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
                "PASSWORD_RESET_REQUEST",
                "pwdResetRejected",
                null
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

