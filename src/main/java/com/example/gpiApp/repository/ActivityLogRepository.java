package com.example.gpiApp.repository;

import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    Page<ActivityLog> findByUser(allUsers user, Pageable pageable);
    
    Page<ActivityLog> findByActivityType(ActivityLog.ActivityType activityType, Pageable pageable);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    Page<ActivityLog> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT a FROM ActivityLog a ORDER BY a.createdAt DESC")
    Page<ActivityLog> findAllOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    Page<ActivityLog> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<ActivityLog> findByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.activityType IN :types ORDER BY a.createdAt DESC")
    Page<ActivityLog> findByActivityTypes(@Param("types") List<ActivityLog.ActivityType> types, Pageable pageable);
}

