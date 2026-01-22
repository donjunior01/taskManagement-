package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Message;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    Page<Message> findBySender(allUsers sender, Pageable pageable);
    
    Page<Message> findByRecipient(allUsers recipient, Pageable pageable);
    
    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.recipient.id = :userId ORDER BY m.createdAt DESC")
    Page<Message> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT m FROM Message m WHERE m.sender.id = :senderId ORDER BY m.createdAt DESC")
    Page<Message> findBySenderId(@Param("senderId") Long senderId, Pageable pageable);
    
    @Query("SELECT m FROM Message m WHERE m.recipient.id = :recipientId ORDER BY m.createdAt DESC")
    Page<Message> findByRecipientId(@Param("recipientId") Long recipientId, Pageable pageable);
    
    @Query("SELECT m FROM Message m WHERE m.recipient.id = :recipientId AND m.isRead = false ORDER BY m.createdAt DESC")
    List<Message> findUnreadByRecipientId(@Param("recipientId") Long recipientId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipient.id = :recipientId AND m.isRead = false")
    Long countUnreadByRecipientId(@Param("recipientId") Long recipientId);
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.recipient.id = :userId2) OR (m.sender.id = :userId2 AND m.recipient.id = :userId1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.recipient.id = :recipientId AND m.sender.id = :senderId")
    void markAsRead(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId);
    
    // Project-based messaging
    @Query("SELECT m FROM Message m WHERE m.project.id = :projectId ORDER BY m.createdAt ASC")
    List<Message> findByProjectId(@Param("projectId") Long projectId);
    
    @Query("SELECT m FROM Message m WHERE m.project.id = :projectId ORDER BY m.createdAt DESC")
    Page<Message> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);
    
    // Direct messages (no project)
    @Query("SELECT m FROM Message m WHERE m.project IS NULL AND ((m.sender.id = :userId1 AND m.recipient.id = :userId2) OR (m.sender.id = :userId2 AND m.recipient.id = :userId1)) ORDER BY m.createdAt ASC")
    List<Message> findDirectConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    // For conversation list
    @Query("SELECT m FROM Message m WHERE m.sender.id = :senderId ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdOrderByCreatedAtDesc(@Param("senderId") Long senderId);
    
    @Query("SELECT m FROM Message m WHERE m.recipient.id = :recipientId ORDER BY m.createdAt DESC")
    List<Message> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);
}

