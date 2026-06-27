package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
