package com.example.gpiApp.repository;

import com.example.gpiApp.entity.DashboardLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DashboardLayoutRepository extends JpaRepository<DashboardLayout, Long> {
    Optional<DashboardLayout> findByUserId(Long userId);
}
