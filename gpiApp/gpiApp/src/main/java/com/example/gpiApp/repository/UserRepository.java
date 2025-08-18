package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<allUsers, Long> {
    Optional<allUsers> findByEmail(String email);

    Optional<allUsers> findByEmailAndIsActiveTrue(String email);
}