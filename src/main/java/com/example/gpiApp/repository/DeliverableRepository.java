package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Deliverable;
import com.example.gpiApp.entity.Task;
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
public interface DeliverableRepository extends JpaRepository<Deliverable, Long> {
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r WHERE d.id = :id")
    Optional<Deliverable> findByIdWithDetails(@Param("id") Long id);
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r ORDER BY d.createdAt DESC")
    Page<Deliverable> findAllWithDetails(Pageable pageable);
    
    Page<Deliverable> findByTask(Task task, Pageable pageable);
    
    List<Deliverable> findByTask(Task task);
    
    Page<Deliverable> findBySubmittedBy(allUsers submittedBy, Pageable pageable);
    
    List<Deliverable> findBySubmittedBy(allUsers submittedBy);
    
    Page<Deliverable> findByStatus(Deliverable.DeliverableStatus status, Pageable pageable);
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r WHERE d.task.id = :taskId ORDER BY d.createdAt DESC")
    Page<Deliverable> findByTaskId(@Param("taskId") Long taskId, Pageable pageable);
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r WHERE d.submittedBy.id = :userId ORDER BY d.createdAt DESC")
    Page<Deliverable> findBySubmittedById(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r WHERE d.status = :status ORDER BY d.createdAt DESC")
    Page<Deliverable> findByStatusOrderByCreatedAtDesc(@Param("status") Deliverable.DeliverableStatus status, Pageable pageable);
    
    @Query("SELECT COUNT(d) FROM Deliverable d WHERE d.status = :status")
    Long countByStatus(@Param("status") Deliverable.DeliverableStatus status);
    
    @Query("SELECT d FROM Deliverable d LEFT JOIN FETCH d.task t LEFT JOIN FETCH t.project p LEFT JOIN FETCH d.submittedBy s LEFT JOIN FETCH d.reviewedBy r WHERE p.manager.id = :managerId AND d.status = :status ORDER BY d.createdAt DESC")
    Page<Deliverable> findByProjectManagerIdAndStatus(@Param("managerId") Long managerId, @Param("status") Deliverable.DeliverableStatus status, Pageable pageable);
}

