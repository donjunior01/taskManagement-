package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<allUsers, Long> {
    Optional<allUsers> findByEmail(String email);
    
    Optional<allUsers> findByEmailAndIsActiveTrue(String email);
    
    List<allUsers> findByUserRole(allUsers.UserRole userRole);
    
    List<allUsers> findByUserPost(allUsers.UserPost userPost);
    
    List<allUsers> findByIsActiveTrue();
    
    @Query("SELECT u FROM allUsers u WHERE u.userRole = :role AND u.isActive = true")
    List<allUsers> findActiveUsersByRole(@Param("role") allUsers.UserRole role);
    
    @Query("SELECT u FROM allUsers u WHERE u.userPost = :post AND u.isActive = true")
    List<allUsers> findActiveUsersByPost(@Param("post") allUsers.UserPost post);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.userRole = :role AND u.isActive = true")
    long countActiveUsersByRole(@Param("role") allUsers.UserRole role);
    
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.userRole = :role")
    long countByUserRole(@Param("role") allUsers.UserRole role);
    
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.isActive = true")
    long countByIsActiveTrue();
    
    @Query("SELECT u FROM allUsers u WHERE u.firstName LIKE %:keyword% OR u.lastName LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<allUsers> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            @Param("keyword") String keyword, @Param("keyword") String keyword2, @Param("keyword") String keyword3);
} 