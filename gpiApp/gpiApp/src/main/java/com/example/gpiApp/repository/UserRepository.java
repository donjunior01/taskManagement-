package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<allUsers, Long> {

    Page<allUsers> findByRole(allUsers.Role role, Pageable pageable);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<allUsers> findByEmail(String email);
} 