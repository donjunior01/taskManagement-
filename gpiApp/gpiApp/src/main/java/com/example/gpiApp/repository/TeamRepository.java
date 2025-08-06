package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByIsActiveTrue();
    
    @Query("SELECT t FROM Team t WHERE t.teamId = :teamId AND t.isActive = true")
    Optional<Team> findByTeamIdAndIsActiveTrue(@Param("teamId") Long teamId);
    
    @Query("SELECT t FROM Team t WHERE t.teamLeader.userId = :teamLeaderId")
    List<Team> findByTeamLeaderUserId(@Param("teamLeaderId") Long teamLeaderId);
    
    @Query("SELECT t FROM Team t WHERE t.teamLeader.userId = :leaderId AND t.isActive = true")
    List<Team> findActiveTeamsByLeader(@Param("leaderId") Long leaderId);
    
    @Query("SELECT t FROM Team t JOIN t.userTeams ut WHERE ut.user.userId = :userId AND t.isActive = true")
    List<Team> findTeamsByMember(@Param("userId") Long userId);
    
    boolean existsByTeamName(String teamName);
    
    @Query("SELECT COUNT(t) FROM Team t WHERE t.isActive = true")
    long countActiveTeams();
} 