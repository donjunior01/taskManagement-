package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Objective;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObjectiveRepository extends JpaRepository<Objective, Long> {
    List<Objective> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
