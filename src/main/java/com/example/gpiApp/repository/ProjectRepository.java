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

    /** Default list excludes archived projects. */
    @Query("SELECT p FROM Project p WHERE p.archived = false OR p.archived IS NULL")
    Page<Project> findAllActive(Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.manager.id = :managerId AND (p.archived = false OR p.archived IS NULL)")
    Page<Project> findByManagerId(@Param("managerId") Long managerId, Pageable pageable);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    Long countByStatus(@Param("status") Project.ProjectStatus status);

    /** Total projects created by a given admin (drives the per-admin dashboard count). */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.createdBy.id = :userId")
    long countByCreatedById(@Param("userId") Long userId);

    /** Projects created by a given admin in a given status. */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.createdBy.id = :userId AND p.status = :status")
    long countByCreatedByIdAndStatus(@Param("userId") Long userId, @Param("status") Project.ProjectStatus status);

    /** Distinct projects a user works on — as manager OR as a member of one of the project's teams. */
    @Query("SELECT COUNT(DISTINCT p) FROM Project p LEFT JOIN p.teams t LEFT JOIN t.members m " +
           "WHERE (p.archived = false OR p.archived IS NULL) AND (p.manager.id = :userId OR m.id = :userId)")
    long countProjectsByUser(@Param("userId") Long userId);
    
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.teams t LEFT JOIN t.members m " +
           "WHERE (p.manager.id = :userId OR m.id = :userId) " +
           "AND p.status NOT IN (:excludedStatuses)")
    List<Project> findActiveProjectsByUserIdAndStatusNotIn(
            @Param("userId") Long userId,
            @Param("excludedStatuses") List<Project.ProjectStatus> excludedStatuses);
            
    @Query("SELECT p FROM Project p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    Page<Project> searchProjects(@Param("keyword") String keyword, Pageable pageable);
}

