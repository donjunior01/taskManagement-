package com.example.gpiApp.repository;

import com.example.gpiApp.entity.PasswordResetRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
    
    Optional<PasswordResetRequest> findByResetToken(String resetToken);
    
    Page<PasswordResetRequest> findByStatus(PasswordResetRequest.ResetStatus status, Pageable pageable);
    
    List<PasswordResetRequest> findByStatusAndExpiresAtBefore(PasswordResetRequest.ResetStatus status, LocalDateTime dateTime);
    
    Page<PasswordResetRequest> findByUserId(Long userId, Pageable pageable);
    
    List<PasswordResetRequest> findByUserIdAndStatusOrderByRequestedAtDesc(Long userId, PasswordResetRequest.ResetStatus status);
}
