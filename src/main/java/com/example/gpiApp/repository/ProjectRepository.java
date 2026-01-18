package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    Page<Project> findByStatus(Project.ProjectStatus status, Pageable pageable);
    
    Page<Project> findByManager(allUsers manager, Pageable pageable);
    
    List<Project> findByManager(allUsers manager);
    
    @Query("SELECT p FROM Project p WHERE p.manager.id = :managerId")
    Page<Project> findByManagerId(@Param("managerId") Long managerId, Pageable pageable);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    Long countByStatus(@Param("status") Project.ProjectStatus status);
    
    @Query("SELECT p FROM Project p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    Page<Project> searchProjects(@Param("keyword") String keyword, Pageable pageable);
}

