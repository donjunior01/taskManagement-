package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId ORDER BY n.sentAt DESC")
    List<Notification> findByUserIdOrderBySentAtDesc(@Param("userId") UUID userId);
    
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.isRead = false")
    List<Notification> findByUserIdAndIsReadFalse(@Param("userId") UUID userId);
    
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.sentAt >= :since ORDER BY n.sentAt DESC")
    List<Notification> findByUserAndSince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.userId = :userId AND n.isRead = false")
    long countUnreadNotificationsByUser(@Param("userId") UUID userId);
    
    @Query("SELECT n FROM Notification n WHERE n.expiresAt < :now")
    List<Notification> findExpiredNotifications(@Param("now") LocalDateTime now);
} 