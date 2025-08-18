package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT p FROM Project p WHERE p.team.teamId = :teamId")
    List<Project> findByTeamTeamId(@Param("teamId") Long teamId);
    
    List<Project> findByStatus(Project.ProjectStatus status);
    
    @Query("SELECT p FROM Project p WHERE p.team.teamId = :teamId AND p.status = :status")
    List<Project> findByTeamAndStatus(@Param("teamId") Long teamId, @Param("status") Project.ProjectStatus status);
    
    @Query("SELECT p FROM Project p WHERE p.startDate <= :date AND p.endDate >= :date")
    List<Project> findActiveProjectsOnDate(@Param("date") LocalDate date);
    
    @Query("SELECT p FROM Project p WHERE p.team.teamLeader.userId = :leaderId")
    List<Project> findProjectsByTeamLeader(@Param("leaderId") Long leaderId);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    long countProjectsByStatus(@Param("status") Project.ProjectStatus status);
    
    @Query("SELECT p FROM Project p WHERE p.endDate < :date AND p.status != 'COMPLETED'")
    List<Project> findOverdueProjects(@Param("date") LocalDate date);
}