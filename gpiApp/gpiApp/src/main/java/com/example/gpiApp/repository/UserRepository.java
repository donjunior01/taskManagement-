package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<allUsers, Long> {
    Optional<allUsers> findByUsername(String username);
    Optional<allUsers> findByEmail(String email);
} 