package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskFileRepository extends JpaRepository<TaskFile, UUID> {
    @Query("SELECT tf FROM TaskFile tf WHERE tf.task.taskId = :taskId")
    List<TaskFile> findByTaskTaskId(@Param("taskId") UUID taskId);
    
    @Query("SELECT tf FROM TaskFile tf WHERE tf.uploadedBy.userId = :userId")
    List<TaskFile> findByUploadedByUserId(@Param("userId") UUID userId);
    
    List<TaskFile> findByIsDeliverableTrue();
    
    @Query("SELECT tf FROM TaskFile tf WHERE tf.task.taskId = :taskId AND tf.fileType = :fileType")
    List<TaskFile> findByTaskAndFileType(@Param("taskId") UUID taskId, @Param("fileType") TaskFile.FileType fileType);
    
    @Query("SELECT tf FROM TaskFile tf WHERE tf.approvalStatus = :status")
    List<TaskFile> findByApprovalStatus(@Param("status") TaskFile.ApprovalStatus status);
    
    @Query("SELECT tf FROM TaskFile tf WHERE tf.isDeliverable = true AND tf.approvalStatus = 'PENDING'")
    List<TaskFile> findPendingDeliverables();
    
    @Query("SELECT COUNT(tf) FROM TaskFile tf WHERE tf.task.taskId = :taskId")
    long countFilesByTask(@Param("taskId") UUID taskId);
} 