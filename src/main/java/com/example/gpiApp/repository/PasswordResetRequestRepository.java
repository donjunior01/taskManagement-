package com.example.gpiApp.repository;

import com.example.gpiApp.entity.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
    List<PasswordResetRequest> findByStatusOrderByRequestedAtDesc(PasswordResetRequest.RequestStatus status);
    Optional<PasswordResetRequest> findByEmailAndStatus(String email, PasswordResetRequest.RequestStatus status);
    List<PasswordResetRequest> findByUser_IdOrderByRequestedAtDesc(Long userId);
}



