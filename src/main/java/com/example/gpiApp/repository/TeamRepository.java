package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    
    Page<Team> findByProject(Project project, Pageable pageable);
    
    List<Team> findByProject(Project project);
    
    Page<Team> findByManager(allUsers manager, Pageable pageable);
    
    List<Team> findByManager(allUsers manager);
    
    @Query("SELECT t FROM Team t WHERE t.project.id = :projectId")
    Page<Team> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);
    
    @Query("SELECT t FROM Team t WHERE t.manager.id = :managerId")
    Page<Team> findByManagerId(@Param("managerId") Long managerId, Pageable pageable);
    
    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.id = :userId")
    List<Team> findByMemberId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(t) FROM Team t WHERE t.project.id = :projectId")
    Long countByProjectId(@Param("projectId") Long projectId);
}

