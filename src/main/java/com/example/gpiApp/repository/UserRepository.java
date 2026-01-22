package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<allUsers, Long> {

    Page<allUsers> findByRole(allUsers.Role role, Pageable pageable);
    
    List<allUsers> findByRole(allUsers.Role role);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    Optional<allUsers> findByEmail(String email);
    
    Optional<allUsers> findByUsername(String username);
    
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.role = :role")
    Long countByRole(@Param("role") allUsers.Role role);
    
    @Query("SELECT u FROM allUsers u WHERE u.firstName LIKE %:keyword% OR u.lastName LIKE %:keyword% OR u.email LIKE %:keyword%")
    Page<allUsers> searchUsers(@Param("keyword") String keyword, Pageable pageable);
} 