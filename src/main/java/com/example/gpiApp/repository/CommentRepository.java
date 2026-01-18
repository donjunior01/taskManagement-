package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Comment;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    Page<Comment> findByTask(Task task, Pageable pageable);
    
    List<Comment> findByTask(Task task);
    
    Page<Comment> findByUser(allUsers user, Pageable pageable);
    
    List<Comment> findByUser(allUsers user);
    
    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId ORDER BY c.createdAt DESC")
    Page<Comment> findByTaskId(@Param("taskId") Long taskId, Pageable pageable);
    
    @Query("SELECT c FROM Comment c WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    Page<Comment> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.task.id = :taskId")
    Long countByTaskId(@Param("taskId") Long taskId);
}

