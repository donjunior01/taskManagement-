package com.example.gpiApp.repository;

import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    /** Number of users in a tenant — drives plan seat limits. */
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.organization.id = :orgId")
    long countByOrganizationId(@Param("orgId") Long orgId);

    /** Count of active accounts with a given role — used to refuse removing/downgrading the last admin. */
    @Query("SELECT COUNT(u) FROM allUsers u WHERE u.role = :role AND u.isActive = true")
    long countActiveByRole(@Param("role") allUsers.Role role);
    
    @Query("SELECT COUNT(u) FROM allUsers u WHERE MONTH(u.createdAt) = MONTH(CURRENT_DATE) AND YEAR(u.createdAt) = YEAR(CURRENT_DATE)")
    Long countUsersCreatedThisMonth();
    
    @Query("SELECT u FROM allUsers u WHERE u.firstName LIKE %:keyword% OR u.lastName LIKE %:keyword% OR u.email LIKE %:keyword%")
    Page<allUsers> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE allUsers u SET u.isActive = :isActive WHERE u.id = :id")
    int updateUserStatus(@Param("id") Long id, @Param("isActive") boolean isActive);
} 