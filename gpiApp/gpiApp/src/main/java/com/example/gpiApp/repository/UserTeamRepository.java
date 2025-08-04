package com.example.gpiApp.repository;

import com.example.gpiApp.entity.UserTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTeamRepository extends JpaRepository<UserTeam, UUID> {
    @Query("SELECT ut FROM UserTeam ut WHERE ut.team.teamId = :teamId")
    List<UserTeam> findByTeamTeamId(@Param("teamId") UUID teamId);
    
    @Query("SELECT ut FROM UserTeam ut WHERE ut.user.userId = :userId")
    List<UserTeam> findByUserUserId(@Param("userId") UUID userId);
    
    @Query("SELECT ut FROM UserTeam ut WHERE ut.team.teamId = :teamId AND ut.isActive = true")
    List<UserTeam> findByTeamTeamIdAndIsActiveTrue(@Param("teamId") UUID teamId);
    
    @Query("SELECT ut FROM UserTeam ut WHERE ut.user.userId = :userId AND ut.isActive = true")
    List<UserTeam> findByUserUserIdAndIsActiveTrue(@Param("userId") UUID userId);
    
    @Query("SELECT ut FROM UserTeam ut WHERE ut.team.teamId = :teamId AND ut.user.userId = :userId")
    Optional<UserTeam> findByTeamTeamIdAndUserUserId(@Param("teamId") UUID teamId, @Param("userId") UUID userId);
    
    @Query("SELECT COUNT(ut) FROM UserTeam ut WHERE ut.team.teamId = :teamId AND ut.isActive = true")
    long countActiveMembersByTeam(@Param("teamId") UUID teamId);
} 